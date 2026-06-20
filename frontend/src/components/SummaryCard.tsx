import { motion } from "framer-motion";
import type { Verdict } from "../types";

const verdictStyles: Record<Verdict, string> = {
  "Low risk": "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "Moderate risk": "border-amber-500/40 bg-amber-500/10 text-amber-300",
  "High uncertainty": "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export default function SummaryCard({
  verdict,
  summary,
  query,
}: {
  verdict: Verdict;
  summary: string;
  query: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Trust Summary</h2>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${verdictStyles[verdict]}`}>
          {verdict}
        </span>
      </div>
      <p className="text-sm text-slate-400">Query: {query}</p>
      <p className="text-slate-200 leading-relaxed">{summary}</p>
    </motion.div>
  );
}
