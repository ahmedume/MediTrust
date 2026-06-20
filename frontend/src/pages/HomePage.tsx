import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../components/SearchBar";
import { startSearch } from "../api";

const EXAMPLES = [
  "GLP-1 agonists cardiovascular outcomes",
  "statin therapy primary prevention",
  "COVID-19 vaccine long-term efficacy",
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const navigate = useNavigate();

  const runSearch = async (q: string) => {
    setLoading(true);
    try {
      const { report_id } = await startSearch(q);
      navigate(`/results/${report_id}?q=${encodeURIComponent(q)}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-8 text-center sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl space-y-6 rounded-2xl p-5 sm:max-w-2xl sm:space-y-8 sm:rounded-3xl sm:p-8 md:max-w-4xl md:p-10 lg:max-w-5xl lg:space-y-8 lg:p-12 xl:max-w-6xl glass"
      >
        <div className="space-y-3 lg:space-y-5">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-soft lg:text-base">
            Medical literature review
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            MedLens
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
            Search PubMed, score evidence quality, and download structured trust reports for your research question.
          </p>
        </div>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={runSearch}
          large
          onOpenChange={setSuggestionsOpen}
        />
        {loading && <p className="text-sm text-slate-500">Preparing your literature review...</p>}
        {!suggestionsOpen && (
          <div className="space-y-3 lg:space-y-4">
            <p className="text-xs uppercase tracking-wider text-slate-500 lg:text-sm">Example searches</p>
            <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setQuery(ex);
                    runSearch(ex);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white lg:px-4 lg:py-2 lg:text-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => query.trim() && runSearch(query)}
          className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-medium transition hover:bg-white/15 lg:px-8 lg:py-3 lg:text-base"
        >
          Start Research
        </button>
      </motion.div>
    </section>
  );
}
