"""PDF export for trust reports."""

from __future__ import annotations

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from backend.app.config import get_settings
from backend.app.models import SearchReport


def _safe(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def generate_pdf_report(report: SearchReport) -> str:
    settings = get_settings()
    settings.ensure_dirs()
    path = settings.pdfs_dir / f"{report.id}.pdf"

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(str(path), pagesize=letter)
    story: list = []

    story.append(Paragraph("MedLens Trust Report", styles["Heading1"]))
    story.append(Paragraph(_safe(f"Query: {report.query}"), styles["Normal"]))
    story.append(Paragraph(_safe(f"Verdict: {report.verdict.value}"), styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(_safe(report.summary), styles["Normal"]))
    story.append(Spacer(1, 16))

    rows = [["Title", "Source", "Type", "Trust"]]
    for article in report.articles:
        rows.append(
            [
                _safe(article.title[:50]),
                _safe(article.source[:28]),
                _safe(article.study_type),
                str(article.trust_score),
            ]
        )
    table = Table(rows, colWidths=[220, 120, 80, 50])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    doc.build(story)
    return str(path)


async def run_pdf_agent(report: SearchReport) -> SearchReport:
    report.pdf_path = generate_pdf_report(report)
    return report
