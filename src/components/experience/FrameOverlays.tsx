"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { useExperience } from "@/lib/experience/store";
import { motion, motionMode } from "@/lib/motion/state";

/** 2.39:1, the anamorphic widescreen ratio. */
const SCOPE = 2.39;

/**
 * Letterbox bars and the fade to ink, drawn over the canvas but under the
 * page (they live in the fixed 3D layer). Driven from the motion proxy on
 * GSAP's ticker, with light smoothing. No letterbox on portrait screens,
 * where 2.39:1 would leave a sliver. When the fade fully covers the canvas
 * it reports `faded`, which stops the render loop until it lifts.
 */
export function FrameOverlays() {
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = { letterbox: motion.letterbox, fade: motion.fade, covered: false };
    const { setFaded } = useExperience.getState();
    const tick = (_time: number, deltaMs: number) => {
      const k = motionMode.snap ? 1 : 1 - Math.exp(-deltaMs / 180);
      s.letterbox += (motion.letterbox - s.letterbox) * k;
      s.fade += (motion.fade - s.fade) * k;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const bar = w > h ? Math.max(0, (h - w / SCOPE) / 2) : 0;
      const scale = `scaleY(${s.letterbox.toFixed(4)})`;
      if (top.current) {
        top.current.style.height = `${bar}px`;
        top.current.style.transform = scale;
      }
      if (bottom.current) {
        bottom.current.style.height = `${bar}px`;
        bottom.current.style.transform = scale;
      }
      if (fade.current) fade.current.style.opacity = s.fade.toFixed(4);
      const covered = s.fade > 0.995;
      if (covered !== s.covered) {
        s.covered = covered;
        setFaded(covered);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <>
      <div ref={top} className="absolute inset-x-0 top-0 origin-top bg-ink-950" />
      <div ref={bottom} className="absolute inset-x-0 bottom-0 origin-bottom bg-ink-950" />
      <div ref={fade} className="absolute inset-0 bg-ink-950 opacity-0" />
    </>
  );
}
