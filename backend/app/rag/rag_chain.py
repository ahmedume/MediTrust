from __future__ import annotations

from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

from backend.app.agents.llm import get_llm
from backend.app.rag.vector_store import retrieve_relevant

QA_SYSTEM_PROMPT = (
    "You are a helpful medical research assistant. Answer the user's question "
    "based strictly on the provided document excerpts. If the excerpts don't contain "
    "enough information to answer confidently, say so clearly.\n\n"
    "Always cite the specific excerpts you are using by including the relevant text "
    "in your response. Maintain a professional, evidence-based tone.\n\n"
    "Context:\n{context}"
)

QA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", QA_SYSTEM_PROMPT),
    ("human", "{question}"),
])


def format_docs(docs) -> str:
    return "\n\n---\n\n".join(
        f"[Source: {d.metadata.get('filename', 'Unknown')}, "
        f"Page {d.metadata.get('page_number', 'N/A')}]\n{d.page_content}"
        for d in docs
    )


def build_rag_chain(doc_id: Optional[str] = None):
    def retriever(query: str):
        return retrieve_relevant(query, doc_id=doc_id, top_k=8)

    llm = get_llm(temperature=0.1)

    chain = (
        {
            "context": RunnableLambda(retriever) | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | QA_PROMPT
        | llm
    )
    return chain


async def answer_question(
    question: str,
    doc_id: Optional[str] = None,
) -> dict:
    chain = build_rag_chain(doc_id)
    result = chain.invoke(question)
    sources = retrieve_relevant(question, doc_id=doc_id, top_k=4)

    return {
        "answer": result.content,
        "sources": [
            {
                "content": s.page_content[:300],
                "filename": s.metadata.get("filename", "Unknown"),
                "page": s.metadata.get("page_number"),
                "score": s.metadata.get("score"),
            }
            for s in sources
        ],
    }
