"use client";

import { button, Leva, useControls } from "leva";
import { getCopy } from "@/content/copy";
import { finishes } from "@/content/finishes";
import { useExperience } from "@/lib/experience/store";
import { cameraProbe } from "@/lib/motion/state";

const PAINT_PRESETS = {
  ...Object.fromEntries(finishes.map((f) => [getCopy().colour.finishes[f.id], f.color])),
  "Source (orange)": "#c97a2b",
};

/**
 * ?debug look-dev panel (leva). Writes straight into the experience store,
 * which the canvas reads. Loaded only when ?debug is in the URL.
 */
export default function DebugPanel() {
  const { paint, setPaint, set } = useExperience.getState();
  const initial = useExperience.getState();

  useControls("Paint", {
    preset: {
      options: PAINT_PRESETS,
      value: paint.color,
      onChange: (color: string) => setPaint({ color }),
    },
    color: { value: paint.color, onChange: (color: string) => setPaint({ color }) },
    metalness: { value: paint.metalness, min: 0, max: 1, step: 0.01, onChange: (metalness: number) => setPaint({ metalness }) },
    roughness: { value: paint.roughness, min: 0, max: 1, step: 0.01, onChange: (roughness: number) => setPaint({ roughness }) },
    clearcoatRoughness: {
      value: paint.clearcoatRoughness,
      min: 0,
      max: 0.5,
      step: 0.005,
      onChange: (clearcoatRoughness: number) => setPaint({ clearcoatRoughness }),
    },
  });

  useControls("Light", {
    environmentIntensity: {
      value: initial.environmentIntensity,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (environmentIntensity: number) => set({ environmentIntensity }),
    },
    exposure: { value: initial.exposure, min: 0.2, max: 2.5, step: 0.05, onChange: (exposure: number) => set({ exposure }) },
    toneMapping: {
      options: { AgX: "agx", "ACES Filmic": "aces" },
      value: initial.toneMapping,
      onChange: (toneMapping: "agx" | "aces") => set({ toneMapping }),
    },
    lampIntensity: { value: initial.lampIntensity, min: 0, max: 10, step: 0.1, onChange: (lampIntensity: number) => set({ lampIntensity }) },
  });

  useControls("Model", {
    showBadges: { value: initial.showBadges, onChange: (showBadges: boolean) => set({ showBadges }) },
    "log settings": button(() => {
      const { paint: p, environmentIntensity, exposure, toneMapping, lampIntensity } = useExperience.getState();
      console.info("[lc300] look-dev", JSON.stringify({ paint: p, environmentIntensity, exposure, toneMapping, lampIntensity }, null, 2));
    }),
  });

  useControls("Camera", {
    freeCamera: {
      label: "free (orbit)",
      value: initial.freeCamera,
      onChange: (freeCamera: boolean) => set({ freeCamera }),
    },
    "copy camera": button(() => {
      // Paste into a ShotKey in src/content/cameraShots.ts. Turn on "free"
      // first: the probe records while orbit controls are active.
      const shot = JSON.stringify({ position: cameraProbe.position, target: cameraProbe.target, look: { fov: cameraProbe.fov } });
      console.info("[lc300] camera", shot);
      void navigator.clipboard?.writeText(shot).catch(() => undefined);
    }),
  });

  return <Leva collapsed={false} titleBar={{ title: "LC300 look-dev" }} />;
}
