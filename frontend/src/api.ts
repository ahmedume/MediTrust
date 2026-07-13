import type {
  PipelineStatus,
  SearchReport,
  RAGDocument,
  RAGChatResponse,
  RAGUploadResponse,
} from "./types";

// Use relative path so Vite proxy handles it; fallback for direct access
const API = import.meta.env.VITE_API_URL || "/api";
const RAG_API = `${API}/rag`;

export async function fetchSuggestions(q: string): Promise<string[]> {
  const res = await fetch(`${API}/suggestions?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

export async function startSearch(query: string): Promise<{ report_id: string }> {
  const res = await fetch(`${API}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function fetchReport(
  reportId: string
): Promise<{ status: PipelineStatus | null; report: SearchReport | null }> {
  const res = await fetch(`${API}/report/${reportId}`);
  if (!res.ok) throw new Error("Report not found");
  return res.json();
}

export function pdfDownloadUrl(reportId: string): string {
  return `${API}/download/${reportId}`;
}

// --- RAG API ---

export async function uploadPDF(file: File): Promise<RAGUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${RAG_API}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || "Upload failed");
  }
  return res.json();
}

export async function fetchRAGDocuments(): Promise<RAGDocument[]> {
  const res = await fetch(`${RAG_API}/documents`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteRAGDocument(docId: string): Promise<void> {
  await fetch(`${RAG_API}/documents/${docId}`, { method: "DELETE" });
}

export async function chatWithPDF(
  question: string,
  docId?: string
): Promise<RAGChatResponse> {
  const res = await fetch(`${RAG_API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, doc_id: docId || null }),
  });
  if (!res.ok) throw new Error("Chat failed");
  return res.json();
}