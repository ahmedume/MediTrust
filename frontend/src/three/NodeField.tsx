import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollStore } from "./scrollStore";
import { sampleShot } from "./shots";

interface NodeFieldProps {
  /** Number of background article nodes. */
  count?: number;
  /** Number of emphasized "high-trust" nodes. */
  highlightCount?: number;
  quality: "high" | "low";
}

const dummy = new THREE.Object3D();

export default function NodeField({
  count = 130,
  highlightCount = 18,
  quality,
}: NodeFieldProps) {
  const group = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const highlightRef = useRef<THREE.InstancedMesh>(null);

  // Stable base directions + radii for every node.
  const { bases, links, highlightBases } = useMemo(() => {
    const bases: THREE.Vector3[] = [];
    const rng = mulberry32(20240517);
    for (let i = 0; i < count; i++) {
      bases.push(randomInSphere(rng, 4.5));
    }
    const highlightBases: THREE.Vector3[] = [];
    for (let i = 0; i < highlightCount; i++) {
      highlightBases.push(randomInSphere(rng, 3.6));
    }

    // Connect nearby background nodes into a literature network.
    const links: [number, number][] = [];
    const maxLinks = quality === "low" ? 90 : 220;
    let attempts = 0;
    while (links.length < maxLinks && attempts < maxLinks * 12) {
      attempts++;
      const a = Math.floor(rng() * count);
      const b = Math.floor(rng() * count);
      if (a === b) continue;
      if (bases[a].distanceTo(bases[b]) < 2.2) links.push([a, b]);
    }
    return { bases, links, highlightBases };
  }, [count, highlightCount, quality]);

  const lineGeo = useMemo(() => {
    const positions = new Float32Array(links.length * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [links]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const s = sampleShot(scrollStore.progress);
    const d = Math.min(delta, 0.05);

    // Continuous, directed drift + scroll-driven spread.
    g.rotation.y += d * 0.06 * scrollStore.intensity;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, Math.sin(scrollStore.progress * Math.PI) * 0.15, 0.05);

    const scale = THREE.MathUtils.lerp(g.scale.x, 0.4 + s.spread * 0.6, 0.06);
    g.scale.setScalar(scale);

    // Update background instances (subtle pulse).
    const nodes = nodesRef.current;
    if (nodes) {
      const t = performance.now() * 0.0006;
      for (let i = 0; i < bases.length; i++) {
        const b = bases[i];
        const pulse = 0.8 + Math.sin(t + i) * 0.2;
        dummy.position.copy(b);
        dummy.scale.setScalar(0.06 * pulse);
        dummy.updateMatrix();
        nodes.setMatrixAt(i, dummy.matrix);
      }
      nodes.instanceMatrix.needsUpdate = true;
    }

    // Gold high-trust nodes ignite based on the scoring shot.
    const hi = highlightRef.current;
    if (hi) {
      const glow = THREE.MathUtils.smoothstep(s.highlight, 0.1, 0.9);
      for (let i = 0; i < highlightBases.length; i++) {
        const b = highlightBases[i];
        const pulse = 1 + Math.sin(performance.now() * 0.002 + i * 1.7) * 0.18;
        dummy.position.copy(b);
        dummy.scale.setScalar(0.12 * glow * pulse + 0.001);
        dummy.updateMatrix();
        hi.setMatrixAt(i, dummy.matrix);
      }
      hi.instanceMatrix.needsUpdate = true;
      (hi.material as THREE.MeshStandardMaterial).emissiveIntensity =
        THREE.MathUtils.lerp(
          (hi.material as THREE.MeshStandardMaterial).emissiveIntensity,
          2.5 * glow,
          0.1,
        );
    }

    // Refresh link line positions from current node bases (scaled group handles spread).
    const arr = lineGeo.attributes.position.array as Float32Array;
    for (let l = 0; l < links.length; l++) {
      const [a, b] = links[l];
      arr[l * 6 + 0] = bases[a].x;
      arr[l * 6 + 1] = bases[a].y;
      arr[l * 6 + 2] = bases[a].z;
      arr[l * 6 + 3] = bases[b].x;
      arr[l * 6 + 4] = bases[b].y;
      arr[l * 6 + 5] = bases[b].z;
    }
    lineGeo.attributes.position.needsUpdate = true;
    (lineGeo as any).computeBoundingSphere?.();
  });

  return (
    <group ref={group}>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, quality === "low" ? 8 : 16, quality === "low" ? 8 : 16]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#3b82f6"
          emissiveIntensity={1.4}
          roughness={0.35}
          metalness={0.1}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={highlightRef} args={[undefined, undefined, highlightCount]} frustumCulled={false}>
        <sphereGeometry args={[1, 18, 18]} />
        <meshStandardMaterial
          color="#f5b342"
          emissive="#f5b342"
          emissiveIntensity={0}
          roughness={0.2}
          metalness={0.3}
          toneMapped={false}
        />
      </instancedMesh>

      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial
          color="#3b6fb0"
          transparent
          opacity={0.18}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

function randomInSphere(rng: () => number, radius: number): THREE.Vector3 {
  const u = rng();
  const v = rng();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(rng());
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
