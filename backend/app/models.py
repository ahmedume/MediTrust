from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class PipelineStage(str, Enum):
    IDLE = "idle"
    RESEARCH = "research"
    EVALUATION = "evaluation"
    STRUCTURING = "structuring"
    PDF = "pdf"
    COMPLETE = "complete"
    ERROR = "error"


class Verdict(str, Enum):
    LOW_RISK = "Low risk"
    MODERATE_RISK = "Moderate risk"
    HIGH_UNCERTAINTY = "High uncertainty"


class TrustBreakdown(BaseModel):
    evidence_quality: float = Field(ge=0, le=100)
    sample_size_strength: float = Field(ge=0, le=100)
    recency: float = Field(ge=0, le=100)
    source_credibility: float = Field(ge=0, le=100)


class RawArticle(BaseModel):
    title: str
    source: str = "PubMed"
    url: str = ""
    abstract: str = ""
    year: int | None = None
    authors: str = ""
    pmid: str = ""


class EvaluatedArticle(BaseModel):
    title: str
    source: str
    study_type: str
    year: int | None
    key_findings: str
    trust_score: int = Field(ge=0, le=100)
    bias_notes: str
    score_explanation: str
    url: str = ""
    pmid: str = ""
    sample_size_hint: str = ""


class ContradictionCluster(BaseModel):
    topic: str
    conflicting_views: list[str]
    consensus: str


class SearchReport(BaseModel):
    id: str
    query: str
    verdict: Verdict
    summary: str
    articles: list[EvaluatedArticle]
    trust_breakdown: TrustBreakdown
    contradictions: list[ContradictionCluster]
    pdf_path: str | None = None
    created_at: str = ""


class PipelineStatus(BaseModel):
    report_id: str
    stage: PipelineStage
    message: str
    progress: int = Field(ge=0, le=100)


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)


class SearchResponse(BaseModel):
    report_id: str
    status: PipelineStage


class SuggestionsResponse(BaseModel):
    suggestions: list[str]
