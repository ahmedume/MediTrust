import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Research" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-white/5 glass">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight sm:text-lg lg:text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/30 bg-accent/20 text-xs text-accent-soft sm:h-8 sm:w-8 sm:text-sm lg:h-9 lg:w-9 lg:text-sm">
              MT
            </span>
            MediTrust
          </Link>
          <nav className="flex w-full min-w-0 items-center justify-between gap-1 text-center text-sm text-slate-400 sm:w-auto sm:justify-end sm:gap-x-6 sm:text-left lg:gap-x-8 lg:text-base">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={
                  pathname === l.to
                    ? "text-white font-medium"
                    : "hover:text-white transition"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex min-w-0 flex-1 flex-col"
      >
        {children}
      </motion.main>
      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        MediTrust is for research review only. Not medical advice.
      </footer>
    </div>
  );
}
