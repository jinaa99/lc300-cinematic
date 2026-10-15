import { getGPUTier } from "detect-gpu";
import { isLowMemory } from "@/hooks/useExperienceCapability";
import type { Tier } from "./store";

/**
 * Second half of the capability gate: looks the GPU up in detect-gpu's
 * benchmark tables (served locally from /detect-gpu, see
 * scripts/copy-decoders.mjs) and maps it to a preset.
 *
 *   tier 0, WebGL unsupported, blocklisted → "off" (posters only)
 *   tier 1 → "low"     (no post-processing, DPR 1)
 *   tier 2 → "medium"  (post without depth of field, DPR ≤ 1.5)
 *   tier 3 → "high"    (everything, DPR ≤ 2)
 *   unknown GPU ("FALLBACK") → "medium" on desktop, "low" on mobile
 *
 * Under 4 GB of reported memory caps the result at "low".
 */
export async function detectTier(): Promise<Tier> {
  try {
    const result = await getGPUTier({ benchmarksURL: "/detect-gpu" });
    let tier: Tier;
    if (result.type === "WEBGL_UNSUPPORTED" || result.type === "BLOCKLISTED" || result.tier === 0) tier = "off";
    else if (result.type === "FALLBACK") tier = result.isMobile ? "low" : "medium";
    else tier = result.tier >= 3 ? "high" : result.tier === 2 ? "medium" : "low";
    if (tier !== "off" && isLowMemory()) tier = "low";
    return tier;
  } catch {
    // Benchmarks unreachable: be conservative rather than heavy.
    return "low";
  }
}
