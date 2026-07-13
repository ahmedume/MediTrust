// Single source of truth for scroll progress (0 -> 1).
// Mutable object so it can be read inside R3F's useFrame without
// bridging React context across the Canvas reconciler.
export const scrollStore = {
  progress: 0,
  // Smoothing factor for device tiers. Lower = smoother/slower camera.
  intensity: 1,
};

export function resetScroll() {
  scrollStore.progress = 0;
}
