@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" uv sync
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
