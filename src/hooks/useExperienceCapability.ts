"use client";

import { useSyncExternalStore } from "react";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

let webgl2: boolean | null = null;
function hasWebGL2() {
  if (webgl2 === null) {
    try {
      webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
}

/** "off" if the device must get the static layer; "check" if the GPU check may run. */
function getGate(): "off" | "check" {
  const nav = navigator as NavigatorHints;
  if (window.matchMedia(REDUCED_MOTION).matches) return "off";
  if (nav.connection?.saveData) return "off";
  if (!hasWebGL2()) return "off";
  return "check";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * First, synchronous half of the capability gate: reduced motion, Save-Data
 * and no WebGL2 mean "off" (static layer and posters, three.js never loads).
 * Otherwise "check": ExperienceRoot then runs the GPU benchmark lookup
 * (src/lib/experience/gpu.ts) to pick low / medium / high.
 *
 * The server snapshot is "off", so server HTML and hydration always match the
 * static layer.
 */
export function useExperienceGate(): "off" | "check" {
  return useSyncExternalStore(subscribe, getGate, () => "off");
}

/** True when the browser reports under 4 GB of memory (Safari never reports it). */
export function isLowMemory() {
  const memory = (navigator as NavigatorHints).deviceMemory;
  return memory !== undefined && memory < 4;
}
