from threading import Lock

from backend.app.models import PipelineStatus, SearchReport

_lock = Lock()
_reports: dict[str, SearchReport] = {}
_statuses: dict[str, PipelineStatus] = {}


def save_report(report: SearchReport) -> None:
    with _lock:
        _reports[report.id] = report


def get_report(report_id: str) -> SearchReport | None:
    with _lock:
        return _reports.get(report_id)


def set_status(status: PipelineStatus) -> None:
    with _lock:
        _statuses[status.report_id] = status


def get_status(report_id: str) -> PipelineStatus | None:
    with _lock:
        return _statuses.get(report_id)
