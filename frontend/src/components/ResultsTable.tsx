import { useState } from "react";
import { motion } from "framer-motion";
import type { EvaluatedArticle } from "../types";
import TrustScoreBadge from "./TrustScoreBadge";

export default function ResultsTable({ articles }: { articles: EvaluatedArticle[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
              <th className="w-[42%] px-4 py-3">Article</th>
              <th className="w-[18%] px-4 py-3">Source</th>
              <th className="w-[18%] px-4 py-3">Type</th>
              <th className="w-[10%] px-4 py-3">Year</th>
              <th className="w-[12%] px-4 py-3">Trust</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a, i) => (
              <motion.tr
                key={a.pmid || a.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => toggle(i)}
              >
                <td className="px-4 py-4 align-top">
                  <p className="font-medium text-white line-clamp-2">{a.title}</p>
                  {expanded.has(i) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 space-y-2 text-slate-400"
                    >
                      <p><span className="text-slate-500">Findings:</span> {a.key_findings}</p>
                      <p><span className="text-slate-500">Bias:</span> {a.bias_notes}</p>
                      <p><span className="text-slate-500">Why this score:</span> {a.score_explanation}</p>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-accent-soft hover:underline text-xs">
                          View source
                        </a>
                      )}
                    </motion.div>
                  )}
                </td>
                <td className="break-words px-4 py-4 align-top text-slate-400">{a.source}</td>
                <td className="break-words px-4 py-4 align-top text-slate-400">{a.study_type}</td>
                <td className="px-4 py-4 text-slate-400 align-top">{a.year ?? "-"}</td>
                <td className="px-4 py-4 align-top">
                  <TrustScoreBadge score={a.trust_score} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-xs text-slate-500">Click a row to expand details.</p>
    </div>
  );
}
