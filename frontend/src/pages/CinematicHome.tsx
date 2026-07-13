import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Scene from "../three/Scene";
import { scrollStore } from "../three/scrollStore";
import { useExperienceTier } from "../three/useExperienceTier";
import SearchBar from "../components/SearchBar";
import { startSearch } from "../api";
import StaticHome from "./StaticHome";

gsap.registerPlugin(ScrollTrigger);

const SHOTS_COPY = [
  {
    eyebrow: "Medical literature review",
    title: "MediTrust",
    body: "Turn any clinical question into a structured, transparent evidence report.",
  },
  {
    eyebrow: "Retrieve",
    title: "Mine the literature",
    body: "Search PubMed across millions of articles, expanded and ranked for relevance to your question.",
  },
  {
    eyebrow: "Evaluate",
    title: "Score the evidence",
    body: "Each article is graded by study design, source credibility, sample size, and recency — the strongest findings ignite.",
  },
  {
    eyebrow: "Synthesize",
    title: "Surface consensus & contradiction",
    body: "MediTrust reconciles what the field agrees on, where it diverges, and what remains uncertain.",
  },
  {
    eyebrow: "Ready when you are",
    title: "Start your review",
    body: "Enter a clinical topic and get a downloadable trust report in minutes.",
  },
];

export default function CinematicHome() {
  const { quality, reducedMotion } = useExperienceTier();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const runSearch = async (q: string) => {
    setLoading(true);
    try {
      const { report_id } = await startSearch(q);
      navigate(`/results/${report_id}?q=${encodeURIComponent(q)}`);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      // Single source of truth for scroll progress (0 -> 1).
      ScrollTrigger.create({
        trigger: scrollRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          scrollStore.progress = self.progress;
        },
      });

      // Pin + fade each shot's copy.
      sectionRefs.current.forEach((el) => {
        if (!el) return;
        const copy = el.querySelector(".shot-copy");
        if (!copy) return;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "+=100%",
              scrub: 1,
              pin: true,
              pinSpacing: true,
            },
          })
          .fromTo(
            copy,
            { autoAlpha: 0, y: 50 },
            { autoAlpha: 1, y: 0, duration: 0.35 },
          )
          .to(copy, { autoAlpha: 0, y: -50, duration: 0.35 }, "+=0.3");
      });
    });

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return <StaticHome onSearch={runSearch} query={query} setQuery={setQuery} loading={loading} />;
  }

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Canvas
          dpr={quality === "high" ? [1, 2] : [1, 1.5]}
          camera={{ position: [0, 0, 15], fov: 45 }}
          gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
        >
          <Scene quality={quality} />
        </Canvas>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950/70" />
      </div>

      <div ref={scrollRef} className="relative">
        {SHOTS_COPY.map((shot, i) => {
          const isReveal = i === SHOTS_COPY.length - 1;
          return (
            <section
              key={i}
              ref={(el) => (sectionRefs.current[i] = el)}
              className="flex h-screen w-full items-center justify-center px-6"
            >
              <div className="shot-copy w-full max-w-2xl text-center">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent-soft">
                  {shot.eyebrow}
                </p>
                <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
                  {shot.title}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  {shot.body}
                </p>

                {isReveal && (
                  <div className="mx-auto mt-10 max-w-xl">
                    <SearchBar
                      value={query}
                      onChange={setQuery}
                      onSubmit={runSearch}
                      large
                      onOpenChange={setSuggestionsOpen}
                    />
                    {loading && (
                      <p className="mt-4 text-sm text-slate-400">
                        Preparing your literature review…
                      </p>
                    )}
                    {!suggestionsOpen && (
                      <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {[
                          "GLP-1 agonists cardiovascular outcomes",
                          "statin therapy primary prevention",
                          "COVID-19 vaccine long-term efficacy",
                        ].map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => {
                              setQuery(ex);
                              runSearch(ex);
                            }}
                            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white lg:text-sm"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
