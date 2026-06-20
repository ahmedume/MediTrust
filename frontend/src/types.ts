export type Verdict = "Low risk" | "Moderate risk" | "High uncertainty";

export type PipelineStage =
  | "idle"
  | "research"
  | "evaluation"
  | "structuring"
  | "pdf"
  | "complete"
  | "error";

export interface EvaluatedArticle {
  title: string;
  source: string;
  study_type: string;
  year: number | null;
  key_findings: string;
  trust_score: number;
  bias_notes: string;
  score_explanation: string;
  url: string;
  pmid: string;
}

export interface TrustBreakdown {
  evidence_quality: number;
  sample_size_strength: number;
  recency: number;
  source_credibility: number;
}

export interface ContradictionCluster {
  topic: string;
  conflicting_views: string[];
  consensus: string;
}

export interface SearchReport {
  id: string;
  query: string;
  verdict: Verdict;
  summary: string;
  articles: EvaluatedArticle[];
  trust_breakdown: TrustBreakdown;
  contradictions: ContradictionCluster[];
  pdf_path: string | null;
}

export interface PipelineStatus {
  report_id: string;
  stage: PipelineStage;
  message: string;
  progress: number;
}
