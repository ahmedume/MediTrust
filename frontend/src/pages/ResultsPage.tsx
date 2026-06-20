import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchReport } from "../api";
import LoadingState from "../components/LoadingState";
import PDFDownloadButton from "../components/PDFDownloadButton";
import ResultsTable from "../components/ResultsTable";
import SummaryCard from "../components/SummaryCard";
import TrustBreakdownChart from "../components/TrustBreakdownChart";
import type { PipelineStatus, SearchReport } from "../types";

export default function ResultsPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [report, setReport] = useState<SearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let active = true;
    const poll = async () => {
      try {
        const data = await fetchReport(reportId);
        if (!active) return;
        setStatus(data.status);
        if (data.report) {
          setReport(data.report);
          return;
        }
        if (data.status?.stage !== "complete" && data.status?.stage !== "error") {
          setTimeout(poll, 1500);
        }
      } catch {
        if (active) setError("Could not load report.");
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [reportId]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-20 text-center text-rose-400">{error}</div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-20">
        <LoadingState status={status} />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Results Dashboard</h1>
        <PDFDownloadButton reportId={report.id} />
      </div>
      <SummaryCard verdict={report.verdict} summary={report.summary} query={report.query || query} />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="min-w-0">
          <h2 className="text-lg font-medium mb-4">Evidence Table</h2>
          <ResultsTable articles={report.articles} />
        </div>
        <div className="min-w-0 w-full">
          <TrustBreakdownChart data={report.trust_breakdown} />
        </div>
      </div>
      {report.contradictions.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contradiction Detection</h2>
          {report.contradictions.map((c) => (
            <div key={c.topic} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
              <p className="font-medium text-accent-soft">{c.topic}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-400 list-disc list-inside">
                {c.conflicting_views.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-slate-300">
                <span className="text-slate-500">Consensus:</span> {c.consensus}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
