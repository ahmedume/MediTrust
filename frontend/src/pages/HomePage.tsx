import { lazy, Suspense } from "react";

const CinematicHome = lazy(() => import("./CinematicHome"));

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <section className="flex flex-1 items-center justify-center text-center">
          <div className="animate-pulse text-sm uppercase tracking-widest text-slate-500">
            Loading MediTrust…
          </div>
        </section>
      }
    >
      <CinematicHome />
    </Suspense>
  );
}
