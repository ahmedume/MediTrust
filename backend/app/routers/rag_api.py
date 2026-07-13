from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel, Field

from backend.app.rag.pdf_processor import process_uploaded_pdf
from backend.app.rag.rag_chain import answer_question
from backend.app.rag.vector_store import list_documents, delete_document
from backend.app.config import get_settings

router = APIRouter(prefix="/api/rag")


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    doc_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    page_count: int
    chunk_count: int
    uploaded_at: str
    evidence_score: int | None = None
    evidence_explanation: str = ""


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    page_count: int
    chunk_count: int
    uploaded_at: str
    evidence_score: int | None = None
    evidence_explanation: str = ""
    evidence_strengths: list[str] = []
    evidence_weaknesses: list[str] = []


ALLOWED_EXTENSIONS = {".pdf"}


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "document.pdf")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Only PDF files are supported.")

    settings = get_settings()
    upload_dir = Path(settings.rag_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / (file.filename or "document.pdf")
    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        result = process_uploaded_pdf(dest, file.filename or "document.pdf")
        return UploadResponse(**result)
    except Exception as e:
        if dest.exists():
            dest.unlink()
        raise HTTPException(500, f"Failed to process PDF: {str(e)}")


@router.get("/documents", response_model=list[DocumentInfo])
async def get_documents():
    return list_documents()


@router.delete("/documents/{doc_id}")
async def remove_document(doc_id: str):
    delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    result = await answer_question(body.question, doc_id=body.doc_id)
    return ChatResponse(**result)
