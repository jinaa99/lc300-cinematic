"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { ACESFilmicToneMapping, AgXToneMapping, SRGBColorSpace } from "three";
import { shotKeys } from "@/content/cameraShots";
import { selectTier, useExperience } from "@/lib/experience/store";
import { activity, motionMode } from "@/lib/motion/state";
import { CameraDirector } from "./CameraDirector";
import { Effects } from "./Effects";
import { Lc300 } from "./Lc300";
import { Studio } from "./Studio";

/** Applies tone mapping and exposure on the renderer (the low tier has no composer). */
function RendererSettings() {
  const get = useThree((s) => s.get);
  const toneMapping = useExperience((s) => s.toneMapping);
  const exposure = useExperience((s) => s.exposure);
  useEffect(() => {
    const { gl } = get();
    gl.toneMapping = toneMapping === "agx" ? AgXToneMapping : ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
  }, [get, toneMapping, exposure]);
  return null;
}

/**
 * Marks the experience live: once everything inside the Suspense boundary
 * has loaded, compiles every shader up front (compileAsync, so the first
 * scroll doesn't hitch), waits two frames, then flips the status. The
 * posters and the loading bar fade out on that signal.
 */
function LiveSignal() {
  const get = useThree((s) => s.get);
  const setStatus = useExperience((s) => s.setStatus);
  useEffect(() => {
    let cancelled = false;
    const { gl, scene, camera } = get();
    void gl
      .compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && setStatus("live")));
      });
    return () => {
      cancelled = true;
    };
  }, [get, setStatus]);
  return null;
}

/**
 * On-demand rendering (low tier): keeps requesting frames while any
 * controller reports it is still moving (damping, travel, turntable, dust,
 * load-in). Scroll and input request frames through motionMode.invalidate.
 */
function KeepAlive() {
  useFrame(({ invalidate }) => {
    for (const busy of activity) {
      if (busy()) {
        invalidate();
        return;
      }
    }
  });
  return null;
}

/** Renderer presets per tier (see docs/ARCHITECTURE.md "Capability gate"). */
const DPR = { low: 1, medium: [1, 1.5], high: [1, 2] } as const;

/**
 * The fixed, full-viewport canvas behind the page (mounted once from the
 * root layout through ExperienceRoot). The camera and scene follow the
 * scroll-driven motion proxy (ScrollDirector → CameraDirector, controllers).
 */
export default function Experience() {
  const tier = useExperience(selectTier);
  const freeCamera = useExperience((s) => s.debug && s.freeCamera);
  const hidden = useExperience((s) => s.hidden || s.faded);
  const degrade = useExperience((s) => s.degrade);
  const setStatus = useExperience((s) => s.setStatus);

  useEffect(() => setStatus("loading"), [setStatus]);
  // Low tier: no idle motion, frames only on demand.
  useEffect(() => {
    motionMode.still = tier === "low";
  }, [tier]);
  useEffect(
    () => () => {
      motionMode.invalidate = null;
    },
    [],
  );

  if (tier === "off") return null;

  return (
    <Canvas
      // Medium/high: continuous while the canvas can be seen (damping,
      // handheld drift, particles). Low: on demand, so a still frame costs
      // nothing on weak devices. Stopped when the tab is hidden, the page
      // has scrolled past <main>, or the closing fade has covered it.
      frameloop={hidden ? "never" : tier === "low" ? "demand" : "always"}
      onCreated={({ invalidate }) => {
        motionMode.invalidate = () => invalidate();
      }}
      dpr={DPR[tier] as number | [number, number]}
      // Low: native MSAA. Medium/high: the composer's SMAA instead.
      gl={{ antialias: tier === "low", outputColorSpace: SRGBColorSpace, powerPreference: "high-performance" }}
      // Near plane 5 cm: the Interior shot flies through the cabin (clearance
      // is checked against this by scripts/check-camera-path.mjs).
      camera={{ fov: 32, near: 0.05, far: 120, position: shotKeys[0].position }}
    >
      <RendererSettings />
      {tier === "low" && <KeepAlive />}
      <CameraDirector free={freeCamera} />
      {/* Sustained low frame rate steps down one tier (high → medium → low). */}
      <PerformanceMonitor onDecline={() => tier !== "low" && degrade()} />
      <Suspense fallback={null}>
        <Studio />
        <Lc300 />
        <LiveSignal />
      </Suspense>
      {tier !== "low" && <Effects tier={tier} />}
    </Canvas>
  );
}
