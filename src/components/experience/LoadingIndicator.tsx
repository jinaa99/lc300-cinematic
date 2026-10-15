"use client";

import { useProgress } from "@react-three/drei";
import { getCopy } from "@/content/copy";
import { useExperience } from "@/lib/experience/store";

/**
 * 3D loading progress: a hairline silver bar along the bottom edge on an
 * ink strip, with the percentage. The hero's server markup stays visible
 * above it the whole time. Holds at 100% while shaders compile, and fades
 * out once the experience is live.
 */
export default function LoadingIndicator() {
  const { progress } = useProgress();
  const live = useExperience((s) => s.status === "live");
  const percent = Math.round(progress);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-ink-950 transition-opacity duration-1000 ease-cinematic ${live ? "opacity-0" : "opacity-100"}`}
      role="progressbar"
      aria-label={getCopy().loading3d}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-hidden={live}
    >
      <div className="frame flex items-center justify-end py-2">
        <span className="text-eyebrow tabular-nums text-silver-500">{percent}%</span>
      </div>
      <div className="h-px w-full bg-ink-700">
        <div
          className="h-px origin-left bg-silver-300 transition-transform duration-500 ease-cinematic"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
    </div>
  );
}
