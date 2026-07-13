import { useState } from "react";
import SearchBar from "../components/SearchBar";

interface StaticHomeProps {
  onSearch: (q: string) => void;
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  "GLP-1 agonists cardiovascular outcomes",
  "statin therapy primary prevention",
  "COVID-19 vaccine long-term efficacy",
];

export default function StaticHome({ onSearch, query, setQuery, loading }: StaticHomeProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-8 text-center sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6 rounded-2xl p-5 sm:max-w-2xl sm:space-y-8 sm:rounded-3xl sm:p-8 md:max-w-4xl md:p-10 lg:max-w-5xl lg:space-y-8 lg:p-12 xl:max-w-6xl glass">
        <div className="space-y-3 lg:space-y-5">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-soft lg:text-base">
            Medical literature review
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            MediTrust
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
            Search PubMed, score evidence quality, and download structured trust
            reports for your research question.
          </p>
        </div>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={onSearch}
          large
          onOpenChange={setSuggestionsOpen}
        />
        {loading && <p className="text-sm text-slate-500">Preparing your literature review...</p>}
        {!suggestionsOpen && (
          <div className="space-y-3 lg:space-y-4">
            <p className="text-xs uppercase tracking-wider text-slate-500 lg:text-sm">
              Example searches
            </p>
            <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setQuery(ex);
                    onSearch(ex);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white lg:px-4 lg:py-2 lg:text-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
