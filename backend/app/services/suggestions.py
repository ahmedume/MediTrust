"""Fast search suggestions: local dataset + synonym expansion + optional Groq."""

from __future__ import annotations

import asyncio

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from backend.app.config import get_settings
from backend.app.services.pubmed import expand_query_terms

COMMON_QUERIES = [
    "statin therapy cardiovascular prevention",
    "metformin type 2 diabetes outcomes",
    "SSRI efficacy major depressive disorder",
    "COVID-19 vaccine booster effectiveness",
    "hypertension treatment guidelines 2024",
    "immunotherapy melanoma survival",
    "GLP-1 agonist weight loss safety",
    "aspirin primary prevention bleeding risk",
    "anticoagulation atrial fibrillation stroke",
    "screening mammography benefits harms",
    "vitamin D supplementation bone health",
    "probiotic gut microbiome meta-analysis",
    "sleep apnea CPAP cardiovascular outcomes",
    "ketogenic diet metabolic syndrome",
    "psilocybin treatment-resistant depression",
]


def local_suggestions(q: str, limit: int = 8) -> list[str]:
    q_lower = q.strip().lower()
    if not q_lower:
        return COMMON_QUERIES[:6]

    scored: list[tuple[int, str]] = []
    for item in COMMON_QUERIES:
        item_lower = item.lower()
        if q_lower in item_lower:
            scored.append((100 - item_lower.index(q_lower), item))
        elif any(word in item_lower for word in q_lower.split() if len(word) > 2):
            scored.append((50, item))

    for term in expand_query_terms(q):
        suggestion = f"{term} clinical evidence review"
        if suggestion.lower() not in {s[1].lower() for s in scored}:
            scored.append((40, suggestion))

    scored.sort(key=lambda x: -x[0])
    out = [s for _, s in scored[:limit]]
    if len(out) < limit:
        for item in COMMON_QUERIES:
            if item not in out:
                out.append(item)
            if len(out) >= limit:
                break
    return out[:limit]


async def groq_suggestions(q: str, limit: int = 4) -> list[str]:
    settings = get_settings()
    if not settings.groq_api_key or len(q.strip()) < 3:
        return []

    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_suggest_model,
        temperature=0.2,
        max_tokens=120,
    )
    prompt = [
        SystemMessage(
            content=(
                "Return exactly 4 short medical literature search queries, one per line, "
                "no numbering, no extra text. Queries must be specific and PubMed-friendly."
            )
        ),
        HumanMessage(content=f"Seed query: {q}"),
    ]
    try:
        resp = await asyncio.wait_for(llm.ainvoke(prompt), timeout=2.5)
        lines = [ln.strip() for ln in str(resp.content).splitlines() if ln.strip()]
        return lines[:limit]
    except (TimeoutError, Exception):
        return []


async def get_suggestions(q: str) -> list[str]:
    local = local_suggestions(q, limit=6)
    ai = await groq_suggestions(q, limit=4)
    merged: list[str] = []
    seen: set[str] = set()
    for item in ai + local:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            merged.append(item)
    return merged[:10]
