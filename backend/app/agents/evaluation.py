"""Evaluation stage: score articles and detect bias."""

from __future__ import annotations

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from backend.app.agents.llm import get_llm
from pydantic import BaseModel, Field

from backend.app.models import EvaluatedArticle, RawArticle
from backend.app.services.trust import compute_trust_score, infer_study_type


class ArticleEvalLLM(BaseModel):
    study_type: str = ""
    key_findings: str = ""
    bias_notes: str = ""
    score_explanation: str = ""
    trust_score: int = Field(default=0, ge=0, le=100)


EVAL_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a medical evidence evaluator. Analyze the article metadata and abstract. "
            "Assign study_type, key_findings (2 sentences), bias_notes, and score_explanation. "
            "Use the provided trust_score as baseline; you may adjust ±5 only with justification. "
            "{format_instructions}",
        ),
        (
            "human",
            "Title: {title}\nSource: {source}\nYear: {year}\nAbstract: {abstract}\n"
            "Baseline trust_score: {trust_score}\nBaseline study_type: {study_type}",
        ),
    ]
)


async def _evaluate_one(article: RawArticle) -> EvaluatedArticle:
    study_type = infer_study_type(article.title, article.abstract)
    trust_score, explanation = compute_trust_score(article, study_type)

    base = EvaluatedArticle(
        title=article.title,
        source=article.source,
        study_type=study_type,
        year=article.year,
        key_findings=article.abstract[:400] or "No abstract available.",
        trust_score=trust_score,
        bias_notes="Automated screening; limited abstract data.",
        score_explanation=explanation,
        url=article.url,
        pmid=article.pmid,
    )

    try:
        llm = get_llm()
        parser = PydanticOutputParser(pydantic_object=ArticleEvalLLM)
        chain = EVAL_PROMPT.partial(format_instructions=parser.get_format_instructions()) | llm | parser
        enriched = await chain.ainvoke(
            {
                "title": article.title,
                "source": article.source,
                "year": article.year or "unknown",
                "abstract": article.abstract or "N/A",
                "trust_score": trust_score,
                "study_type": study_type,
            }
        )
        return EvaluatedArticle(
            title=base.title,
            source=base.source,
            study_type=enriched.study_type or base.study_type,
            year=base.year,
            key_findings=enriched.key_findings or base.key_findings,
            trust_score=max(0, min(100, enriched.trust_score or base.trust_score)),
            bias_notes=enriched.bias_notes or base.bias_notes,
            score_explanation=enriched.score_explanation or base.score_explanation,
            url=base.url,
            pmid=base.pmid,
        )
    except (ValueError, TimeoutError):
        return base


async def _evaluate_batch(articles: list[RawArticle]) -> list[EvaluatedArticle]:
    results: list[EvaluatedArticle] = []
    for article in articles:
        results.append(await _evaluate_one(article))
    return results


async def run_evaluation_agent(articles: list[RawArticle]) -> list[EvaluatedArticle]:
    if not articles:
        return []
    return await _evaluate_batch(articles)
