"""Deterministic trust scoring from study metadata."""

from __future__ import annotations

import re
from datetime import datetime

from backend.app.models import RawArticle

STUDY_TYPE_WEIGHTS = {
    "rct": 1.0,
    "randomized controlled trial": 1.0,
    "systematic review": 0.92,
    "meta-analysis": 0.95,
    "cohort": 0.72,
    "observational": 0.65,
    "case-control": 0.6,
    "case report": 0.45,
    "review": 0.7,
    "editorial": 0.4,
    "commentary": 0.35,
    "blog": 0.25,
    "unknown": 0.5,
}

SOURCE_TIER = {
    1: ("pubmed", "nejm", "lancet", "jama", "bmj", "nature", "cell", "plos"),
    2: ("university", "hospital", "nih", "cdc", "who", "mayo", "cleveland"),
    3: ("healthline", "webmd", "blog", "medium"),
}


def infer_study_type(title: str, abstract: str) -> str:
    text = f"{title} {abstract}".lower()
    patterns = [
        ("randomized controlled trial", "RCT"),
        ("randomised controlled trial", "RCT"),
        ("rct", "RCT"),
        ("systematic review", "Systematic review"),
        ("meta-analysis", "Meta-analysis"),
        ("meta analysis", "Meta-analysis"),
        ("cohort study", "Cohort"),
        ("observational", "Observational"),
        ("case-control", "Case-control"),
        ("case report", "Case report"),
        ("clinical trial", "Clinical trial"),
        ("review", "Review"),
    ]
    for phrase, label in patterns:
        if phrase in text:
            return label
    return "Review"


def source_tier(source: str) -> int:
    s = source.lower()
    for tier, keywords in SOURCE_TIER.items():
        if any(k in s for k in keywords):
            return tier
    if "pubmed" in s or "journal" in s:
        return 1
    return 2 if any(k in s for k in ("med", "clinic", "hospital")) else 4


def sample_size_strength(abstract: str) -> float:
    text = abstract.lower()
    match = re.search(r"n\s*=\s*(\d[\d,]*)", text)
    if not match:
        match = re.search(r"(\d[\d,]*)\s+patients", text)
    if not match:
        return 50.0
    n = int(match.group(1).replace(",", ""))
    if n >= 5000:
        return 95.0
    if n >= 1000:
        return 85.0
    if n >= 300:
        return 72.0
    if n >= 100:
        return 58.0
    if n >= 30:
        return 42.0
    return 28.0


def recency_score(year: int | None) -> float:
    if not year:
        return 45.0
    age = datetime.now().year - year
    if age <= 1:
        return 98.0
    if age <= 3:
        return 88.0
    if age <= 5:
        return 75.0
    if age <= 10:
        return 58.0
    return 40.0


def study_type_score(study_type: str) -> float:
    key = study_type.lower()
    for name, weight in STUDY_TYPE_WEIGHTS.items():
        if name in key:
            return weight * 100
    return 55.0


def tier_score(tier: int) -> float:
    return {1: 95.0, 2: 75.0, 3: 45.0, 4: 25.0}.get(tier, 30.0)


def compute_trust_score(article: RawArticle, study_type: str | None = None) -> tuple[int, str]:
    st = study_type or infer_study_type(article.title, article.abstract)
    st_w = study_type_score(st) * 0.4
    tier_w = tier_score(source_tier(article.source)) * 0.25
    sample_w = sample_size_strength(article.abstract) * 0.2
    rec_w = recency_score(article.year) * 0.15
    total = int(round(st_w + tier_w + sample_w + rec_w))
    total = max(0, min(100, total))
    explanation = (
        f"Study type ({st}) contributed {st_w:.0f}%, source tier {source_tier(article.source)} "
        f"contributed {tier_w:.0f}%, sample-size signal {sample_w:.0f}%, "
        f"recency ({article.year or 'unknown'}) {rec_w:.0f}%."
    )
    return total, explanation
