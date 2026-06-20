export default function TrustScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
    score >= 55 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}
