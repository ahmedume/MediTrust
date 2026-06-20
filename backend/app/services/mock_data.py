"""Sample data when PubMed or API calls return nothing."""

from backend.app.models import (
    ContradictionCluster,
    EvaluatedArticle,
    SearchReport,
    TrustBreakdown,
    Verdict,
)


def build_mock_report(report_id: str, query: str) -> SearchReport:
    articles = [
        EvaluatedArticle(
            title=f"Systematic review of {query} interventions",
            source="PubMed / Journal of Clinical Evidence",
            study_type="Systematic review",
            year=2024,
            key_findings="Moderate benefit with heterogeneous trial quality; larger trials show more consistent outcomes.",
            trust_score=82,
            bias_notes="Publication bias possible; several included studies were industry-funded.",
            score_explanation="High weight from systematic review design and Tier-1 source.",
            url="https://pubmed.ncbi.nlm.nih.gov/",
            pmid="mock-1",
        ),
        EvaluatedArticle(
            title=f"Randomized trial evaluating {query} in adults",
            source="PubMed / NEJM",
            study_type="RCT",
            year=2023,
            key_findings="Primary endpoint met with statistically significant improvement vs placebo.",
            trust_score=91,
            bias_notes="Well-powered design; limited long-term follow-up.",
            score_explanation="RCT from top-tier journal with strong methodology weighting.",
            url="https://pubmed.ncbi.nlm.nih.gov/",
            pmid="mock-2",
        ),
        EvaluatedArticle(
            title=f"Observational cohort on real-world {query} outcomes",
            source="PubMed / BMC Medicine",
            study_type="Observational",
            year=2022,
            key_findings="Association observed but confounding by indication not fully ruled out.",
            trust_score=68,
            bias_notes="Residual confounding; non-random treatment assignment.",
            score_explanation="Observational design lowers study-type weight despite adequate sample hints.",
            url="https://pubmed.ncbi.nlm.nih.gov/",
            pmid="mock-3",
        ),
    ]
    return SearchReport(
        id=report_id,
        query=query,
        verdict=Verdict.MODERATE_RISK,
        summary=(
            f"Evidence for «{query}» is mixed but directionally favorable in higher-quality trials. "
            "RCT and systematic review data support moderate confidence; observational data adds context "
            "with more uncertainty. This is research synthesis, not medical advice."
        ),
        articles=articles,
        trust_breakdown=TrustBreakdown(
            evidence_quality=78.0,
            sample_size_strength=72.0,
            recency=85.0,
            source_credibility=88.0,
        ),
        contradictions=[
            ContradictionCluster(
                topic="Effect size vs long-term safety",
                conflicting_views=[
                    "Short-term trials report clear efficacy signals.",
                    "Longer observational follow-up suggests attenuated benefits.",
                ],
                consensus="Benefit likely exists but magnitude and durability remain debated.",
            )
        ],
    )
