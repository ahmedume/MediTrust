import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSuggestions } from "../api";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  placeholder?: string;
  large?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search a medical topic…",
  large = false,
  onOpenChange,
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const items = await fetchSuggestions(q);
    setSuggestions(items);
    setOpen(items.length > 0);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadSuggestions(value), 120);
    return () => clearTimeout(debounceRef.current);
  }, [value, loadSuggestions]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = (q: string) => {
    if (!q.trim()) return;
    setOpen(false);
    onSubmit(q.trim());
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) submit(value);
        }}
        className={`relative z-10 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl px-4 sm:flex sm:flex-row sm:items-center sm:px-5 lg:gap-4 lg:px-6 ${large ? "py-4 lg:py-4" : "py-3"} glass`}
      >
        <svg className="h-5 w-5 shrink-0 text-slate-500 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder={placeholder}
          className={`min-w-0 flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 ${large ? "text-base sm:text-lg lg:text-xl" : "text-base"}`}
          autoComplete="off"
        />
        <button
          type="submit"
          className="col-span-2 w-full shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-soft sm:col-span-1 sm:w-auto lg:px-6 lg:py-3 lg:text-base"
        >
          Research
        </button>
      </form>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl divide-y divide-white/5 glass"
          >
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white lg:px-5 lg:text-base"
                  onMouseDown={() => {
                    onChange(s);
                    submit(s);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
