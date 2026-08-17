# MediTrust

<p align="center">
  <strong>Medical literature intelligence platform</strong><br>
  PubMed retrieval → trust-scored evidence → structured reports → document Q&A
</p>

> [!IMPORTANT]
> MediTrust is for research review only. **Not medical advice.**

## Features

- **PubMed Literature Search** — Retrieve articles via NCBI E-utilities with clinical query expansion
- **Trust Scoring** — Evidence quality scored by study design, source credibility, sample size, and recency
- **LLM Enrichment** — Plain-language summaries, bias notes, contradiction detection (Groq via LangChain; falls back to deterministic scoring if unavailable)
- **PDF Evidence Reports** — Downloadable styled reports with verdicts, tables, and score breakdowns
- **RAG Document Upload** — Upload your own PDFs; the system chunks, embeds, and indexes them into ChromaDB
- **Evidence Assessment** — Each uploaded PDF receives an automated evidence quality score (0–100)
- **RAG Chatbot** — Ask questions against uploaded PDFs with cited source excerpts
- **Responsive Dashboard** — Pipeline status, results review, trust breakdown charts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Pydantic, LangChain |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion |
| LLM | Groq Cloud (`llama-3.3-70b-versatile`) via LangChain |
| Vector DB | Chroma (persistent, on-disk) |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` |
| Data Sources | PubMed / NCBI E-utilities + user-uploaded PDFs |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Backend

```powershell
cd meditrust
uv sync
copy .env.example .env
# Edit .env and add your GROQ_API_KEY (optional — pipeline falls back without it)
uv run uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Or run `start_backend.bat`.

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the app at `http://localhost:5173`.
API documentation at `http://localhost:8000/docs`.

## Environment

Create a `.env` file from `.env.example` and configure the variables below.

```env
# Required for LLM enrichment (optional — deterministic fallback if omitted)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_SUGGEST_MODEL=llama-3.1-8b-instant

# Data directories
REPORTS_DIR=data/reports
PDF_DIR=data/pdfs
VECTOR_STORE_DIR=data/vector_store
RAG_UPLOAD_DIR=data/uploads

# Optional
FRONTEND_URL=
PORT=8000
```

Get a Groq API key at [console.groq.com](https://console.groq.com).

## RAG Architecture

### Ingestion Pipeline

```
Upload PDF → Parse text (PyPDF) → Chunk (800 chars, 100 overlap)
→ Embed (all-MiniLM-L6-v2) → Index in ChromaDB → LLM evidence assessment
```

### Retrieval Pipeline

```
User question → Embed query → Chroma similarity search (top 8)
→ Format context with source citations → Groq LLM → Answer + cited sources
```

## Project Structure

```
backend/
  app/
    agents/         # LLM pipeline stages (research, evaluation, structuring, PDF)
    rag/            # RAG ingestion, vector store, chat chain
    routers/        # FastAPI route handlers
    services/       # PubMed, trust scoring, suggestions
    config.py       # Pydantic settings (loaded from .env)
    main.py         # FastAPI app entrypoint
    models.py       # Shared Pydantic models
    store.py        # In-memory report/status store
frontend/
  src/
    api.ts          # API client
    components/     # Reusable UI components
    pages/          # Route pages (HomePage, ResultsPage, SearchPage, etc.)
    three/          # 3D scene components
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/suggestions?q=` | Search suggestions |
| `POST` | `/api/search` | Start PubMed literature review |
| `GET` | `/api/report/{id}` | Poll report status / get result |
| `GET` | `/api/download/{id}` | Download PDF report |
| `POST` | `/api/rag/upload` | Upload PDF for RAG ingestion |
| `GET` | `/api/rag/documents` | List uploaded documents |
| `DELETE` | `/api/rag/documents/{id}` | Delete uploaded document |
| `POST` | `/api/rag/chat` | Ask question against uploaded PDF |

## Notes

- Do not commit `.env`, generated reports, virtual environments, or dependency folders.
- Dependencies are managed with `uv` — use `uv sync` to install, not pip directly.
- The vector store persists in `data/vector_store/` between restarts.
- The backend exposes OpenAPI docs at `/docs`.
- The frontend serves from Vite and communicates with the backend via the `/api` proxy.


## Screenshots
<img width="1890" height="855" alt="meditrust" src="https://github.com/user-attachments/assets/40b5c0fb-a1ba-492d-ab46-8c74a9347ecb" />

<img width="1906" height="772" alt="meditrust (2)" src="https://github.com/user-attachments/assets/a8dd5ca1-58b0-44e0-a2b0-a9a9164839ca" />

<img width="1885" height="857" alt="meditrust (3)" src="https://github.com/user-attachments/assets/74c360cd-9526-4072-9d1a-c97a1e35ff34" />


