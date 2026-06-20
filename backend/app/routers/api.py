from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from backend.app.agents.evaluation import run_evaluation_agent
from backend.app.agents.pdf_agent import run_pdf_agent
from backend.app.agents.research import run_research_agent
from backend.app.agents.structuring import run_structuring_agent
from backend.app.models import (
    PipelineStage,
    PipelineStatus,
    SearchRequest,
    SearchResponse,
    SuggestionsResponse,
)
from backend.app.services.mock_data import build_mock_report
from backend.app.services.suggestions import get_suggestions
from backend.app.store import get_report, get_status, save_report, set_status

router = APIRouter(prefix="/api")


@router.get("/health")
async def health():
    return {"status": "ok", "service": "medlens"}


@router.get("/suggestions", response_model=SuggestionsResponse)
async def suggestions(q: str = ""):
    items = await get_suggestions(q)
    return SuggestionsResponse(suggestions=items)


async def _run_pipeline_with_id(query: str, report_id: str):
    def st(stage: PipelineStage, msg: str, prog: int) -> None:
        set_status(
            PipelineStatus(report_id=report_id, stage=stage, message=msg, progress=prog)
        )

    st(PipelineStage.RESEARCH, "Retrieving articles from PubMed...", 10)
    raw = await run_research_agent(query)
    if not raw:
        st(PipelineStage.STRUCTURING, "No PubMed hits; using curated sample data.", 55)
        report = build_mock_report(report_id, query)
        report.created_at = datetime.now(timezone.utc).isoformat()
    else:
        st(PipelineStage.EVALUATION, "Scoring evidence quality...", 40)
        evaluated = await run_evaluation_agent(raw)
        st(PipelineStage.STRUCTURING, "Assembling trust report...", 70)
        report = await run_structuring_agent(report_id, query, evaluated)

    st(PipelineStage.PDF, "Generating PDF report...", 88)
    report = await run_pdf_agent(report)
    save_report(report)
    st(PipelineStage.COMPLETE, "Report ready.", 100)


@router.post("/search", response_model=SearchResponse)
async def search(body: SearchRequest, background_tasks: BackgroundTasks):
    report_id = str(uuid.uuid4())
    set_status(
        PipelineStatus(
            report_id=report_id,
            stage=PipelineStage.RESEARCH,
            message="Starting literature review...",
            progress=5,
        )
    )
    background_tasks.add_task(_run_pipeline_with_id, body.query, report_id)
    return SearchResponse(report_id=report_id, status=PipelineStage.RESEARCH)


@router.get("/report/{report_id}")
async def get_report_endpoint(report_id: str):
    status = get_status(report_id)
    report = get_report(report_id)
    if not report and status and status.stage != PipelineStage.COMPLETE:
        return {"status": status, "report": None}
    if not report:
        raise HTTPException(404, "Report not found")
    return {"status": status, "report": report}


@router.get("/download/{report_id}")
async def download_report(report_id: str):
    report = get_report(report_id)
    if not report or not report.pdf_path:
        raise HTTPException(404, "PDF not ready")
    path = Path(report.pdf_path)
    if not path.exists():
        raise HTTPException(404, "PDF file missing")
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"medlens-{report_id[:8]}.pdf",
    )
