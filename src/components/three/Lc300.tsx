"use client";

import { ContactShadows, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, WebGLRenderer } from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { selectTier, useExperience } from "@/lib/experience/store";
import { createVehicleController } from "./controllers/vehicle";
import { Dust } from "./Dust";
import { applyMaterials, applyPaint } from "./materials";

export const MODEL_URL = "/models/lc300.glb";

// Decode Meshopt geometry off the main thread. (Not a React hook despite
// the name, so it is called through an alias the hooks lint doesn't match.)
const startDecoderWorkers = MeshoptDecoder.useWorkers.bind(MeshoptDecoder);
startDecoderWorkers(2);

let ktx2: KTX2Loader | null = null;
/** One KTX2 transcoder per page; served from public/basis (scripts/copy-decoders.mjs). */
function ktx2Loader(gl: WebGLRenderer) {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl);
  return ktx2;
}

/**
 * The LC300 with look-dev materials, inside a group that carries the
 * vehicle's travel (carZ) and the turntable. The contact shadow and dust sit
 * in the same group so they move with it. Per-frame values come from the
 * motion proxy; paint and badges from the experience store. Draco is off
 * (the model uses Meshopt); decoders are local, no CDN.
 */
export function Lc300() {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  // Draco off; drei's own Meshopt decoder off in favour of the worker one.
  const { scene } = useGLTF(MODEL_URL, false, false, (loader) => {
    const gltf = loader as unknown as { setKTX2Loader: (l: KTX2Loader) => void; setMeshoptDecoder: (d: unknown) => void };
    gltf.setKTX2Loader(ktx2Loader(gl));
    gltf.setMeshoptDecoder(MeshoptDecoder);
  });

  const tier = useExperience(selectTier);
  const paint = useExperience((s) => s.paint);
  const lampIntensity = useExperience((s) => s.lampIntensity);
  const showBadges = useExperience((s) => s.showBadges);
  const live = useExperience((s) => s.status === "live");

  const handles = useMemo(() => applyMaterials(scene, tier), [scene, tier]);
  const controller = useMemo(
    () => createVehicleController({ root: scene, lamps: handles.lamps, tailLamps: handles.tailLamps, glassMeshes: handles.glassMeshes }),
    [scene, handles],
  );

  useEffect(() => controller.track(), [controller]);
  useEffect(() => {
    applyPaint(handles.paint, paint);
    invalidate();
  }, [handles, paint, invalidate]);
  useEffect(() => {
    scene.traverse((object) => {
      if (object.userData.badge) object.visible = showBadges;
    });
    invalidate();
  }, [scene, showBadges, invalidate]);

  const vehicle = useRef<Group>(null);
  useFrame((_, delta) => controller.update(vehicle.current, delta, lampIntensity));

  return (
    <group ref={vehicle}>
      <primitive object={scene} />
      {/* Baked once when live, with the vehicle at rest; it travels and turns
          with the group. Must stay at y=0 (see docs/ARCHITECTURE.md). */}
      <ContactShadows
        key={live ? "live" : "loading"}
        scale={[10, 10]}
        far={2.5}
        blur={2.2}
        opacity={0.85}
        resolution={1024}
        frames={1}
      />
      {tier !== "low" && <Dust />}
    </group>
  );
}
