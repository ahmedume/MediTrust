import type { TrustBreakdown } from "../types";

const labels: { key: keyof TrustBreakdown; label: string }[] = [
  { key: "evidence_quality", label: "Evidence quality" },
  { key: "sample_size_strength", label: "Sample size" },
  { key: "recency", label: "Recency" },
  { key: "source_credibility", label: "Source credibility" },
];

export default function TrustBreakdownChart({ data }: { data: TrustBreakdown }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-lg">Trust Breakdown</h3>
      <div className="space-y-3">
        {labels.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{label}</span>
              <span>{Math.round(data[key])}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent-soft/80"
                style={{ width: `${data[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
