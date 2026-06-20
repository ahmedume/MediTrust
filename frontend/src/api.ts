import type { PipelineStatus, SearchReport } from "./types";

const API = "/api";

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
