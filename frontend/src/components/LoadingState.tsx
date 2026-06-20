import { motion } from "framer-motion";
import type { PipelineStatus } from "../types";

const STAGES = [
  { key: "research", label: "Retrieving literature" },
  { key: "evaluation", label: "Scoring evidence" },
  { key: "structuring", label: "Building report" },
  { key: "pdf", label: "Generating PDF" },
];

export default function LoadingState({ status }: { status: PipelineStatus | null }) {
  const progress = status?.progress ?? 0;
  const stage = status?.stage ?? "research";

  return (
    <div className="glass rounded-2xl p-8 max-w-lg mx-auto text-center space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-12 h-12 mx-auto rounded-full border-2 border-accent/30 border-t-accent"
      />
      <div>
        <p className="text-lg font-medium text-white">Analyzing literature</p>
        <p className="text-sm text-slate-400 mt-1">{status?.message ?? "Starting literature review…"}</p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <ul className="text-left text-sm space-y-2">
        {STAGES.map((s) => {
          const active = stage === s.key;
          const done =
            STAGES.findIndex((x) => x.key === stage) > STAGES.findIndex((x) => x.key === s.key) ||
            stage === "complete";
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2 ${active ? "text-accent-soft" : done ? "text-emerald-400/80" : "text-slate-500"}`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {s.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
