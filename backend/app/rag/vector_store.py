from __future__ import annotations

import hashlib
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from backend.app.config import get_settings

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


@lru_cache(maxsize=1)
def _get_embedding_function() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)


def _get_chroma_client() -> chromadb.PersistentClient:
    settings = get_settings()
    chroma_dir = Path(settings.vector_store_dir)
    chroma_dir.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(
        path=str(chroma_dir),
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def get_vector_store(collection_name: str = "pdf_documents") -> Chroma:
    embeddings = _get_embedding_function()
    client = _get_chroma_client()
    return Chroma(
        client=client,
        collection_name=collection_name,
        embedding_function=embeddings,
    )


def chunk_document(text: str, metadata: dict) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "],
    )
    docs = splitter.create_documents(
        texts=[text],
        metadatas=[metadata],
    )
    for doc in docs:
        doc.metadata["chunk_id"] = str(
            uuid.UUID(hashlib.md5(doc.page_content.encode()).hexdigest())
        )
    return docs


def index_documents(docs: list[Document], collection_name: str = "pdf_documents") -> int:
    ids = [d.metadata["chunk_id"] for d in docs]
    vector_store = get_vector_store(collection_name)

    existing = set()
    if vector_store._collection.count() > 0:
        existing = {
            m["chunk_id"]
            for m in vector_store._collection.get(ids=ids, include=["metadatas"])["metadatas"]
            if m
        }

    new_docs = [d for d in docs if d.metadata["chunk_id"] not in existing]
    if not new_docs:
        return 0

    new_ids = [d.metadata["chunk_id"] for d in new_docs]
    vector_store.add_documents(documents=new_docs, ids=new_ids)
    return len(new_docs)


def retrieve_relevant(
    query: str,
    doc_id: Optional[str] = None,
    top_k: int = 10,
    collection_name: str = "pdf_documents",
) -> list[Document]:
    vector_store = get_vector_store(collection_name)
    filter_dict = {"doc_id": doc_id} if doc_id else None
    results = vector_store.similarity_search_with_score(
        query,
        k=top_k,
        filter=filter_dict,
    )
    return [doc for doc, _ in results]


def delete_document(doc_id: str, collection_name: str = "pdf_documents") -> None:
    vector_store = get_vector_store(collection_name)
    results = vector_store.get(where={"doc_id": doc_id})
    if results and results.get("ids"):
        vector_store.delete(ids=results["ids"])


def list_documents(collection_name: str = "pdf_documents") -> list[dict]:
    vector_store = get_vector_store(collection_name)
    all_data = vector_store.get(include=["metadatas"])
    seen = {}
    for meta in all_data.get("metadatas", []):
        if meta and meta.get("doc_id"):
            doc_id = meta["doc_id"]
            if doc_id not in seen:
                seen[doc_id] = {
                    "doc_id": doc_id,
                    "filename": meta.get("filename", "Unknown"),
                    "page_count": meta.get("page_count", 0),
                    "uploaded_at": meta.get("uploaded_at", ""),
                    "evidence_score": meta.get("evidence_score"),
                    "evidence_explanation": meta.get("evidence_explanation"),
                    "chunk_count": 0,
                }
            seen[doc_id]["chunk_count"] += 1
    return list(seen.values())
