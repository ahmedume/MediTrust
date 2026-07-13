import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, DepthOfField, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import NodeField from "./NodeField";
import { scrollStore } from "./scrollStore";
import { sampleShot } from "./shots";

function CameraRig() {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const s = sampleShot(scrollStore.progress);
    const lerp = 0.08 * scrollStore.intensity;
    camera.position.lerp(s.pos, lerp);
    lookTarget.current.lerp(s.target, lerp);
    camera.lookAt(lookTarget.current);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, s.fov, lerp);
    cam.updateProjectionMatrix();
  });

  return null;
}

function MoodLighting() {
  const key = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  const { scene } = useThree();

  useFrame(() => {
    const s = sampleShot(scrollStore.progress);
    if (key.current) {
      key.current.color.copy(s.keyColor);
      key.current.intensity = s.keyIntensity;
    }
    if (ambient.current) ambient.current.intensity = s.ambient;
    if (coreLight.current) coreLight.current.color.copy(s.keyColor);
    if (scene.fog) {
      (scene.fog as THREE.FogExp2).color.copy(s.fogColor);
      (scene.fog as THREE.FogExp2).density = s.fogDensity;
    } else {
      scene.fog = new THREE.FogExp2(s.fogColor.getHex(), s.fogDensity);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.4} />
      <directionalLight ref={key} position={[5, 6, 4]} intensity={3} />
      <pointLight ref={coreLight} position={[0, 0, 0]} intensity={6} distance={20} decay={1.5} />
    </>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.15;
    ref.current.rotation.x += delta * 0.05;
    const s = 1 + Math.sin(performance.now() * 0.001) * 0.04;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.25, 1]} />
      <meshStandardMaterial
        color="#0b1220"
        emissive="#3b82f6"
        emissiveIntensity={1.6}
        roughness={0.25}
        metalness={0.6}
        flatShading
        toneMapped={false}
      />
    </mesh>
  );
}

export default function Scene({ quality }: { quality: "high" | "low" }) {
  const bloomRef = useRef<any>(null);

  useFrame(() => {
    const s = sampleShot(scrollStore.progress);
    if (bloomRef.current) bloomRef.current.intensity = s.bloom;
  });

  return (
    <>
      <color attach="background" args={["#05070f"]} />
      <fogExp2 attach="fog" args={["#05070f", 0.045]} />
      <CameraRig />
      <MoodLighting />
      <Core />
      <NodeField quality={quality} />

      <EffectComposer multisampling={quality === "high" ? 4 : 0}>
        <Bloom
          ref={bloomRef}
          intensity={0.6}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.2}
          mipmapBlur
          radius={0.8}
        />
        {quality === "high" ? (
          <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2.2} height={480} />
        ) : <></>}
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}
