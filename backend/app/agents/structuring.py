"""Structuring stage: assemble frontend-ready report JSON."""

from __future__ import annotations

from datetime import datetime, timezone

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from backend.app.agents.llm import get_llm
from pydantic import BaseModel, Field

from backend.app.models import (
    ContradictionCluster,
    EvaluatedArticle,
    SearchReport,
    TrustBreakdown,
    Verdict,
)


class ReportSynthesis(BaseModel):
    verdict: Verdict
    summary: str = ""
    trust_breakdown: TrustBreakdown | None = None
    contradictions: list[ContradictionCluster] = Field(default_factory=list)


SYNTH_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Synthesize a medical literature trust report from evaluated articles. "
            "Choose verdict: Low risk, Moderate risk, or High uncertainty. "
            "Write a 3-sentence summary. Detect contradictions if present. "
            "{format_instructions}",
        ),
        ("human", "Query: {query}\n\nArticles JSON:\n{articles_json}"),
    ]
)


def _avg_scores(articles: list[EvaluatedArticle]) -> TrustBreakdown:
    if not articles:
        return TrustBreakdown(
            evidence_quality=50,
            sample_size_strength=50,
            recency=50,
            source_credibility=50,
        )
    scores = [a.trust_score for a in articles]
    avg = sum(scores) / len(scores)
    return TrustBreakdown(
        evidence_quality=avg,
        sample_size_strength=avg * 0.9,
        recency=avg * 0.85,
        source_credibility=avg * 0.95,
    )


def _verdict_from_scores(articles: list[EvaluatedArticle]) -> Verdict:
    if not articles:
        return Verdict.HIGH_UNCERTAINTY
    avg = sum(a.trust_score for a in articles) / len(articles)
    if avg >= 75:
        return Verdict.LOW_RISK
    if avg >= 55:
        return Verdict.MODERATE_RISK
    return Verdict.HIGH_UNCERTAINTY


async def run_structuring_agent(
    report_id: str, query: str, articles: list[EvaluatedArticle]
) -> SearchReport:
    breakdown = _avg_scores(articles)
    verdict = _verdict_from_scores(articles)
    articles_json = "\n".join(
        f"- {a.title} ({a.study_type}, score {a.trust_score}): {a.key_findings[:200]}"
        for a in articles
    )

    summary = (
        f"Analysis of «{query}» across {len(articles)} sources. "
        f"Average trust score {int(sum(a.trust_score for a in articles) / max(len(articles), 1))}. "
        "Not medical advice. Consult a clinician."
    )
    contradictions: list[ContradictionCluster] = []

    try:
        llm = get_llm()
        parser = PydanticOutputParser(pydantic_object=ReportSynthesis)
        chain = SYNTH_PROMPT.partial(format_instructions=parser.get_format_instructions()) | llm | parser
        synth = await chain.ainvoke({"query": query, "articles_json": articles_json})
        if synth.verdict:
            verdict = synth.verdict
        if synth.summary:
            summary = synth.summary
        if synth.trust_breakdown:
            breakdown = synth.trust_breakdown
        if synth.contradictions:
            contradictions = synth.contradictions
    except (ValueError, TimeoutError):
        high = [a for a in articles if a.trust_score >= 80]
        low = [a for a in articles if a.trust_score < 60]
        if high and low:
            contradictions.append(
                ContradictionCluster(
                    topic="Evidence strength split",
                    conflicting_views=[
                        f"Higher-trust studies (n={len(high)}) suggest clearer effects.",
                        f"Lower-trust studies (n={len(low)}) show weaker or conflicting signals.",
                    ],
                    consensus="Higher-quality evidence leans positive; weaker studies add uncertainty.",
                )
            )

    return SearchReport(
        id=report_id,
        query=query,
        verdict=verdict,
        summary=summary,
        articles=articles,
        trust_breakdown=breakdown,
        contradictions=contradictions,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

