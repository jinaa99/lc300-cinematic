"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import {
  BlendFunction,
  type BloomEffect,
  type DepthOfFieldEffect,
  type NoiseEffect,
  ToneMappingMode,
  type VignetteEffect,
} from "postprocessing";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import { useExperience } from "@/lib/experience/store";
import { motion } from "@/lib/motion/state";

/**
 * Post-processing for the medium and high tiers (low has none). Strengths
 * follow the motion proxy, so the shot list sets them per chapter:
 *
 *   SMAA (instead of MSAA, which the composer would make expensive)
 *   Depth of field: high tier only; non-zero only in the Light and Interior shots
 *   Bloom: high threshold, mipmap blur; only lamps and hot spots glow
 *   Tone mapping: the composer turns the renderer's off, so it is applied here
 *   Vignette, film grain (noise)
 */
export function Effects({ tier }: { tier: "medium" | "high" }) {
  const toneMapping = useExperience((s) => s.toneMapping);
  const dof = useRef<DepthOfFieldEffect>(null);
  const bloom = useRef<BloomEffect>(null);
  const vignette = useRef<VignetteEffect>(null);
  const noise = useRef<NoiseEffect>(null);
  const focus = useMemo(() => new Vector3(motion.focusX, motion.focusY, motion.focusZ), []);

  useFrame(() => {
    if (dof.current) {
      dof.current.bokehScale = 6 * motion.dof;
      dof.current.target?.set(motion.focusX, motion.focusY, motion.focusZ);
    }
    if (bloom.current) bloom.current.intensity = motion.bloom;
    if (vignette.current) vignette.current.darkness = motion.vignette;
    if (noise.current) noise.current.blendMode.opacity.value = motion.noise;
  });

  const mode = toneMapping === "agx" ? ToneMappingMode.AGX : ToneMappingMode.ACES_FILMIC;

  return tier === "high" ? (
    <EffectComposer multisampling={0}>
      <SMAA />
      <DepthOfField ref={dof} target={focus} focalLength={0.02} bokehScale={0} />
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={1.6} luminanceSmoothing={0.3} intensity={0.35} />
      <ToneMapping mode={mode} />
      <Vignette ref={vignette} offset={0.32} darkness={0.55} />
      <Noise ref={noise} premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.03} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={1.6} luminanceSmoothing={0.3} intensity={0.35} />
      <ToneMapping mode={mode} />
      <Vignette ref={vignette} offset={0.32} darkness={0.55} />
      <Noise ref={noise} premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.03} />
    </EffectComposer>
  );
}
