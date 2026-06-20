# MedLens

MedLens is a full-stack medical literature review platform that converts clinical research questions into structured evidence reports. It retrieves PubMed articles, evaluates evidence quality with transparent scoring, summarizes consensus and contradictions, and exports PDF summaries.

## Features

- Search PubMed using NCBI E-utilities
- Expand clinical queries for broader literature retrieval
- Score article quality by study design, source credibility, sample size, and recency
- Identify consensus, contradictions, and uncertainty across abstracts
- Generate downloadable PDF evidence reports
- Responsive React dashboard with search, pipeline status, results review, and downloads

## Tech Stack

- Backend: Python, FastAPI, Pydantic, httpx, ReportLab
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Data: PubMed / NCBI E-utilities
- Optional provider: Groq via LangChain

## Getting Started

### Prerequisites

- Python 3.14+
- Node.js 18+
- uv

### Backend

```powershell
git clone https://github.com/YOUR_USERNAME/medlens.git
cd medlens
uv sync
copy .env.example .env
uv run uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

API documentation is available at `http://localhost:8000/docs`.

## Environment

Create a `.env` file from `.env.example` and configure the variables below.

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_SUGGEST_MODEL=llama-3.1-8b-instant
REPORTS_DIR=data/reports
PDF_DIR=data/pdfs
```

The `GROQ_API_KEY` is optional. MedLens can run with PubMed retrieval and deterministic scoring even without an API key.

## Notes

- Do not commit `.env`, generated reports, virtual environments, or dependency folders.
- The backend exposes OpenAPI docs at `/docs`.
- The frontend serves from Vite and communicates with the backend API.

## Disclaimer

MedLens is intended for research review and literature summarization. It is not medical advice and should not be used as a substitute for professional clinical judgment.
