# MediTrust

MediTrust is a full-stack medical literature intelligence platform. It combines PubMed literature retrieval with **RAG (Retrieval-Augmented Generation)** over user-uploaded PDFs to produce structured evidence reports, trust-scored article evaluations, and interactive document Q&A.

## Features

- **PubMed Literature Search** — Retrieve articles via NCBI E-utilities with clinical query expansion
- **Trust Scoring** — Evidence quality scored by study design, source credibility, sample size, and recency
- **LLM Enrichment** — Plain-language summaries, bias notes, contradiction detection (Groq via LangChain)
- **PDF Evidence Reports** — Downloadable styled reports with verdicts, tables, and score breakdowns
- **RAG Document Upload** — Upload your own PDFs; the system chunks, embeds, and indexes them into ChromaDB
- **Evidence Assessment** — Each uploaded PDF receives an automated evidence quality score (0–100)
- **RAG Chatbot** — Ask questions against uploaded PDFs with cited source excerpts
- **3D Cinematic Landing** — Scroll-driven Three.js visualisation with device-tier fallback
- **Responsive Dashboard** — Pipeline status, results review, trust breakdown charts

## Tech Stack

- Backend: Python, FastAPI, Pydantic, LangChain, ChromaDB, HuggingFace Embeddings
- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Three.js
- Data: PubMed / NCBI E-utilities + user-uploaded PDFs
- LLM: Groq Cloud (`llama-3.3-70b-versatile`) via LangChain
- Vector DB: Chroma (persistent, on-disk)

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```powershell
cd meditrust
uv sync
copy .env.example .env
# Edit .env and add your GROQ_API_KEY (optional)
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

API documentation is available at `http://localhost:8000/docs`.

## Environment

Create a `.env` file from `.env.example` and configure the variables below.

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_SUGGEST_MODEL=llama-3.1-8b-instant
REPORTS_DIR=data/reports
PDF_DIR=data/pdfs
VECTOR_STORE_DIR=data/vector_store
RAG_UPLOAD_DIR=data/uploads
FRONTEND_URL=
PORT=8000
```

A `GROQ_API_KEY` is required for evidence assessment, LLM enrichment, and RAG chatbot responses. Get one at [console.groq.com](https://console.groq.com).

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
- The backend exposes OpenAPI docs at `/docs`.
- The frontend serves from Vite and communicates with the backend via the `/api` proxy.
- Dependencies are managed with `uv` — use `uv sync` to install, not pip directly.
- The vector store persists in `data/vector_store/` between restarts.

## Disclaimer

MediTrust is intended for research review and literature summarization. It is not medical advice and should not be used as a substitute for professional clinical judgment.
