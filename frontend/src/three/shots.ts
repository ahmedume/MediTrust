import * as THREE from "three";

export interface Shot {
  /** Scroll progress (0 -> 1) at which this keyframe is fully reached. */
  at: number;
  /** Camera world position. */
  pos: [number, number, number];
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Vertical field of view in degrees. */
  fov: number;
  /** Key light color (hex). */
  keyColor: string;
  /** Key light intensity. */
  keyIntensity: number;
  /** Ambient fill intensity. */
  ambient: number;
  /** Scene fog color (hex). */
  fogColor: string;
  /** Exponential fog density. */
  fogDensity: number;
  /** Bloom strength for this shot. */
  bloom: number;
  /** How far the node network has expanded (0 = clustered, 1 = full spread). */
  spread: number;
  /** 0 -> 1 how ignited the gold "high-trust" nodes are. */
  highlight: number;
}

// Authored camera path + mood for the MediTrust journey.
export const SHOTS: Shot[] = [
  {
    at: 0.0,
    pos: [0, 0, 15],
    target: [0, 0, 0],
    fov: 45,
    keyColor: "#3b82f6",
    keyIntensity: 2.2,
    ambient: 0.35,
    fogColor: "#070b16",
    fogDensity: 0.045,
    bloom: 0.55,
    spread: 0.15,
    highlight: 0,
  },
  {
    at: 0.18,
    pos: [0, 1.4, 8.5],
    target: [0, 0, 0],
    fov: 42,
    keyColor: "#60a5fa",
    keyIntensity: 3.0,
    ambient: 0.5,
    fogColor: "#0a1020",
    fogDensity: 0.05,
    bloom: 0.7,
    spread: 1.0,
    highlight: 0,
  },
  {
    at: 0.4,
    pos: [7.5, 2.2, 6.5],
    target: [0, 0, 0],
    fov: 40,
    keyColor: "#93c5fd",
    keyIntensity: 3.4,
    ambient: 0.55,
    fogColor: "#0b1326",
    fogDensity: 0.045,
    bloom: 0.85,
    spread: 1.0,
    highlight: 1,
  },
  {
    at: 0.62,
    pos: [0, -3.2, 9.5],
    target: [0, -1.2, 0],
    fov: 38,
    keyColor: "#475569",
    keyIntensity: 1.8,
    ambient: 0.3,
    fogColor: "#05070f",
    fogDensity: 0.075,
    bloom: 0.5,
    spread: 0.55,
    highlight: 0.45,
  },
  {
    at: 0.82,
    pos: [-5.5, 1.2, 7.5],
    target: [0, 0, 0],
    fov: 41,
    keyColor: "#bfdbfe",
    keyIntensity: 3.2,
    ambient: 0.6,
    fogColor: "#0a1224",
    fogDensity: 0.04,
    bloom: 0.9,
    spread: 0.85,
    highlight: 0.2,
  },
  {
    at: 1.0,
    pos: [0, 0, 12],
    target: [0, 0, 0],
    fov: 47,
    keyColor: "#e0ecff",
    keyIntensity: 4.0,
    ambient: 0.8,
    fogColor: "#0c1428",
    fogDensity: 0.025,
    bloom: 1.1,
    spread: 0.7,
    highlight: 0.1,
  },
];

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export interface SampledShot {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  keyColor: THREE.Color;
  keyIntensity: number;
  ambient: number;
  fogColor: THREE.Color;
  fogDensity: number;
  bloom: number;
  spread: number;
  highlight: number;
}

const _pos = new THREE.Vector3();
const _target = new THREE.Vector3();
const _key = new THREE.Color();
const _fog = new THREE.Color();

/** Interpolate the two nearest keyframes for the current progress. */
export function sampleShot(progress: number): SampledShot {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let i = 0;
  while (i < SHOTS.length - 1 && SHOTS[i + 1].at <= p) i++;
  const a = SHOTS[i];
  const b = SHOTS[Math.min(i + 1, SHOTS.length - 1)];
  const span = b.at - a.at || 1;
  const t = smoothstep(THREE.MathUtils.clamp((p - a.at) / span, 0, 1));

  _pos.set(...a.pos).lerp(_vec(b.pos), t);
  _target.set(...a.target).lerp(_vec(b.target), t);
  _key.set(a.keyColor).lerp(_col(b.keyColor), t);
  _fog.set(a.fogColor).lerp(_col(b.fogColor), t);

  return {
    pos: _pos.clone(),
    target: _target.clone(),
    fov: THREE.MathUtils.lerp(a.fov, b.fov, t),
    keyColor: _key.clone(),
    keyIntensity: THREE.MathUtils.lerp(a.keyIntensity, b.keyIntensity, t),
    ambient: THREE.MathUtils.lerp(a.ambient, b.ambient, t),
    fogColor: _fog.clone(),
    fogDensity: THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, t),
    bloom: THREE.MathUtils.lerp(a.bloom, b.bloom, t),
    spread: THREE.MathUtils.lerp(a.spread, b.spread, t),
    highlight: THREE.MathUtils.lerp(a.highlight, b.highlight, t),
  };
}

const _tmpVec = new THREE.Vector3();
function _vec(v: [number, number, number]) {
  return _tmpVec.set(v[0], v[1], v[2]);
}
const _tmpCol = new THREE.Color();
function _col(hex: string) {
  return _tmpCol.set(hex);
}
