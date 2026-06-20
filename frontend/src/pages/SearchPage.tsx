import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { startSearch } from "../api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const runSearch = async (q: string) => {
    const { report_id } = await startSearch(q);
    navigate(`/results/${report_id}?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
      <div className="w-full max-w-xl space-y-8 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl lg:space-y-10 xl:max-w-6xl">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">Research Search</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
            Suggestions from medical keywords, common queries, and related search terms.
          </p>
        </div>
        <SearchBar value={query} onChange={setQuery} onSubmit={runSearch} large />
      </div>
    </section>
  );
}
