from __future__ import annotations

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from langchain_core.documents import Document
from pypdf import PdfReader

from backend.app.rag.vector_store import chunk_document, index_documents
from backend.app.agents.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate


def parse_pdf(file_path: str | Path) -> tuple[str, int]:
    reader = PdfReader(str(file_path))
    text_parts = []
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text_parts.append(extracted)
    return "\n\n".join(text_parts), len(reader.pages)


EVIDENCE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a medical evidence quality assessor. Analyze the following document "
        "and rate its overall evidence quality on a scale of 0-100 based on:\n"
        "- Scientific rigor and methodology (40%)\n"
        "- Citations and references to established research (25%)\n"
        "- Clarity and transparency of claims (15%)\n"
        "- Awareness of limitations and bias (10%)\n"
        "- Overall professionalism and structure (10%)\n\n"
        "Return a JSON object with keys: score (integer 0-100), explanation (string), "
        "strengths (list of strings), weaknesses (list of strings).",
    ),
    ("human", "Document:\n\n{document_text}"),
])


def assess_evidence_quality(document_text: str) -> dict:
    try:
        llm = get_llm(temperature=0.1)
        chain = EVIDENCE_PROMPT | llm
        result = chain.invoke({"document_text": document_text[:15000]})
        import json
        content = result.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("\n", 1)[0]
        if content.startswith("json"):
            content = content[4:].strip()
        return json.loads(content)
    except Exception:
        return {
            "score": 50,
            "explanation": "Evidence quality could not be fully assessed by LLM.",
            "strengths": [],
            "weaknesses": ["No automated assessment available"],
        }


def _sanitize_metadata(meta: dict) -> dict:
    """ChromaDB rejects None and empty lists in metadata; replace them."""
    result = {}
    for k, v in meta.items():
        if v is None:
            result[k] = "none"
        elif isinstance(v, list):
            result[k] = v if v else ["none"]
        else:
            result[k] = v
    return result


def process_uploaded_pdf(file_path: str | Path, filename: str) -> dict:
    raw_text, page_count = parse_pdf(file_path)
    doc_id = os.path.splitext(filename)[0]
    uploaded_at = datetime.now(timezone.utc).isoformat()

    evidence = assess_evidence_quality(raw_text)

    strengths = evidence.get("strengths") or []
    weaknesses = evidence.get("weaknesses") or []

    metadata = _sanitize_metadata({
        "doc_id": doc_id,
        "filename": filename,
        "page_count": page_count,
        "uploaded_at": uploaded_at,
        "evidence_score": evidence.get("score", 50),
        "evidence_explanation": evidence.get("explanation", ""),
        "evidence_strengths": strengths,
        "evidence_weaknesses": weaknesses,
    })

    docs = chunk_document(raw_text, metadata)
    chunk_count = index_documents(docs)

    return {
        "doc_id": doc_id,
        "filename": filename,
        "page_count": page_count,
        "chunk_count": chunk_count,
        "uploaded_at": uploaded_at,
        "evidence_score": evidence.get("score", 50),
        "evidence_explanation": evidence.get("explanation", ""),
        "evidence_strengths": strengths,
        "evidence_weaknesses": weaknesses,
    }
