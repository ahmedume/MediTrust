import { useEffect, useState } from "react";

export interface ExperienceTier {
  quality: "high" | "low";
  reducedMotion: boolean;
}

/** Detect device capability + motion preference once on mount. */
export function useExperienceTier(): ExperienceTier {
  const [tier, setTier] = useState<ExperienceTier>({
    quality: "high",
    reducedMotion: false,
  });

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 4;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const lowTier = coarse || cores <= 4 || mem <= 4;
    setTier({ quality: lowTier ? "low" : "high", reducedMotion });
  }, []);

  return tier;
}
