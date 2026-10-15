"use client";

import { useEffect, useState } from "react";
import { type Look, resolvedKeys, type ShotKey } from "@/content/cameraShots";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useExperience } from "@/lib/experience/store";
import { intro, motion, motionMode } from "@/lib/motion/state";
import { duration } from "@/lib/motion/tokens";
import { eases, gsap, ScrollTrigger, useGSAP } from "./gsap";

/** Absolute scroll position (px) of a shot key. See ShotKey.at. */
function scrollPosition(key: ShotKey) {
  const el = document.getElementById(key.chapter);
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const vh = window.innerHeight;
  const range = Math.max(0, el.offsetHeight - vh);
  return key.at >= 0 ? top + key.at * range : top + key.at * vh;
}

type State = Look & { path: number };

/**
 * One master timeline for the whole page, scrubbed by scroll. It tweens the
 * motion proxy (src/lib/motion/state.ts) between the shot keys in
 * src/content/cameraShots.ts; the canvas applies the values with damping.
 * Timeline time is measured in scroll pixels, so keys land exactly on their
 * sections. Rebuilt when the layout changes.
 *
 * Reduced motion: no timeline. Each chapter snaps to its settled frame.
 */
export default function ScrollDirector() {
  const reduced = usePrefersReducedMotion();
  const live = useExperience((s) => s.status === "live");
  const [layout, setLayout] = useState(0);

  // Rebuild on layout changes (resize, fonts). Debounced. On touch screens a
  // height-only resize is the browser toolbar showing or hiding mid-scroll;
  // chapter heights are in vh (the large viewport), so the layout hasn't
  // moved, and rebuilding there would rebuild the timeline on every swipe.
  useEffect(() => {
    let timer = 0;
    let width = window.innerWidth;
    const touch = window.matchMedia("(pointer: coarse)");
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLayout((n) => n + 1), 200);
    };
    const onResize = () => {
      if (touch.matches && window.innerWidth === width) return;
      width = window.innerWidth;
      bump();
    };
    window.addEventListener("resize", onResize);
    void document.fonts?.ready.then(bump);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const keys = resolvedKeys();
      const last = keys.length - 1;
      const state = (i: number): State => ({ path: i / last, ...keys[i].look });
      const max = ScrollTrigger.maxScroll(window);
      const positions = keys.map((k) => Math.min(max, Math.max(0, scrollPosition(k) ?? 0)));

      if (reduced) {
        motionMode.snap = true;
        Object.assign(motion, state(0));
        // The settled frame of a chapter is its last key.
        const settled = new Map<string, number>();
        keys.forEach((k, i) => settled.set(k.chapter, i));
        for (const [chapter, index] of settled) {
          ScrollTrigger.create({
            trigger: `#${chapter}`,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (!self.isActive) return;
              Object.assign(motion, state(index));
              motionMode.invalidate?.();
            },
          });
        }
        return;
      }

      motionMode.snap = false;
      const timeline = gsap.timeline({ paused: true });
      timeline.set(motion, state(0), 0);
      for (let i = 1; i <= last; i++) {
        const start = positions[i - 1];
        const length = Math.max(1, positions[i] - start);
        timeline.to(motion, { ...state(i), duration: length, ease: eases[keys[i].ease ?? "drift"] }, start);
      }
      // Pad so timeline time == scroll pixels all the way to the bottom.
      const end = positions[last];
      if (end < max) timeline.to({}, { duration: max - end }, end);

      ScrollTrigger.create({
        start: 0,
        end: "max",
        scrub: true,
        animation: timeline,
        onUpdate: () => motionMode.invalidate?.(),
      });
    },
    { dependencies: [reduced, layout], revertOnUpdate: true },
  );

  // Load-in: lamps and rim light come up once the model is on screen.
  useGSAP(
    () => {
      if (!live) return;
      if (reduced) {
        intro.value = 1;
        motionMode.invalidate?.();
        return;
      }
      gsap.fromTo(intro, { value: 0 }, { value: 1, duration: duration.scene, ease: eases.cinematic, delay: 0.3 });
    },
    { dependencies: [live, reduced] },
  );

  return null;
}
