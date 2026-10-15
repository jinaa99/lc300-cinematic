"use client";

import { MeshReflectorMaterial, useTexture } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { BackSide, DoubleSide, type Mesh, SRGBColorSpace } from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { selectTier, useExperience } from "@/lib/experience/store";
import { createStudioSet } from "./controllers/studio";
import { ReflectionEnvironment } from "./ReflectionEnvironment";

/** CC0, Poly Haven (see docs/ASSETS.md). */
const STUDIO_HDRI = "/models/env/studio_small_09_1k.hdr";
const STEPPE_HDRI = "/models/env/belfast_sunset_1k.hdr";
const STEPPE_BACKPLATE = "/models/env/belfast_sunset_backplate_4k.webp";

const FLOOR_COLOR = "#050506";

/** Reads a colour token from globals.css so the 3D backdrop matches the page. */
function cssToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

type CardProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  form?: "rect" | "ring";
  onMesh: (mesh: Mesh | null) => void;
};

/** A softbox: an unlit card whose brightness the controller sets every frame. */
function Card({ position, rotation = [0, 0, 0], scale, form = "rect", onMesh }: CardProps) {
  return (
    <mesh ref={onMesh} position={position} rotation={rotation} scale={scale}>
      {form === "ring" ? <ringGeometry args={[0.5, 1, 64]} /> : <planeGeometry />}
      <meshBasicMaterial toneMapped={false} side={DoubleSide} />
    </mesh>
  );
}

/**
 * Lighting and set. The reflection environment is a small virtual scene
 * rendered into a cube map, re-baked only when the look changes:
 * the studio HDRI dimmed as a room, the steppe HDRI, and softbox cards. The
 * motion proxy crossfades studio → steppe dusk → night (controllers/studio.ts).
 * The camera sees an ink backdrop in the studio and the steppe backplate
 * outside, with fog and floor matched to each.
 */
export function Studio() {
  const tier = useExperience(selectTier);
  const environmentIntensity = useExperience((s) => s.environmentIntensity);
  const ink = useMemo(() => cssToken("--color-ink-950", "#050506"), []);

  const [studioHdr, steppeHdr] = useLoader(HDRLoader, [STUDIO_HDRI, STEPPE_HDRI]);
  const backplate = useTexture(STEPPE_BACKPLATE, (t) => {
    t.colorSpace = SRGBColorSpace;
  });

  const set = useMemo(() => createStudioSet(ink, FLOOR_COLOR), [ink]);
  useFrame(({ gl, scene }) => set.update(gl, scene, environmentIntensity));

  return (
    <>
      <color attach="background" args={[ink]} />
      <fog attach="fog" args={[ink, 14, 32]} />

      <ReflectionEnvironment resolution={tier === "high" ? 256 : tier === "medium" ? 128 : 64} onReady={set.reflection}>
        <mesh ref={set.mesh("studio")} rotation-y={Math.PI * 0.35} scale={[-40, 40, 40]}>
          <sphereGeometry args={[1, 48, 24]} />
          <meshBasicMaterial map={studioHdr} side={BackSide} toneMapped={false} transparent depthWrite={false} />
        </mesh>
        <mesh ref={set.mesh("steppe")} scale={[-39, 39, 39]}>
          <sphereGeometry args={[1, 48, 24]} />
          <meshBasicMaterial map={steppeHdr} side={BackSide} toneMapped={false} transparent depthWrite={false} />
        </mesh>
        {/* Overhead softbox: the broad highlight across hood and roof. */}
        <Card position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 2.6, 1]} onMesh={set.card(4)} />
        {/* Tall side cards: the soft gradient that models the flanks. */}
        <Card position={[7, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[18, 3, 1]} onMesh={set.card(2.5)} />
        <Card position={[-7, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[18, 3, 1]} onMesh={set.card(1.5)} />
        {/* Thin kicker strip low on the camera side: a crisp line along the sills. */}
        <Card position={[6.5, 0.6, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[16, 0.25, 1]} onMesh={set.card(6)} />
        {/* Front card for the grille and lamps. */}
        <Card position={[3, 1.6, 8]} rotation={[0, Math.PI * 0.85, 0]} scale={[6, 2, 1]} onMesh={set.card(1.5)} />
        {/* Rim light from behind: separates the silhouette; up at night and in Contact. */}
        <Card position={[0, 2.5, -9]} scale={[4, 4, 4]} form="ring" onMesh={set.card(2, "rim")} />
      </ReflectionEnvironment>

      {/* Steppe backplate, seen behind the vehicle outside the studio. */}
      <mesh ref={set.mesh("backplate")} scale={[-45, 45, 45]} renderOrder={-1}>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial map={backplate} side={BackSide} fog={false} transparent depthWrite={false} />
      </mesh>

      {/* Floor sits just below y=0: ContactShadows must stay at y=0, since its
          blur pass draws a plane at the world origin from the shadow camera
          (raising it puts that plane behind the camera and blanks the shadow). */}
      <mesh ref={set.mesh("floor")} rotation-x={-Math.PI / 2} position-y={-0.004}>
        <circleGeometry args={[60, 96]} />
        {tier === "high" ? (
          <MeshReflectorMaterial
            color={FLOOR_COLOR}
            roughness={1}
            metalness={0.6}
            blur={[500, 150]}
            mixBlur={1}
            mixStrength={6}
            mixContrast={1}
            resolution={1024}
            mirror={0.6}
            depthScale={1}
            minDepthThreshold={0.8}
            maxDepthThreshold={1.2}
          />
        ) : (
          <meshStandardMaterial color={FLOOR_COLOR} roughness={0.6} metalness={0.3} />
        )}
      </mesh>
    </>
  );
}
