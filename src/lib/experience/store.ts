import { create } from "zustand";
import { defaultFinish } from "@/content/finishes";
import { siteConfig } from "@/content/site";

/** Capability tier, see docs/ARCHITECTURE.md "Capability gate". */
export type Tier = "off" | "low" | "medium" | "high";

/** Tiers that render 3D, weakest first. */
export const renderTiers = ["low", "medium", "high"] as const;

export type ExperienceStatus = "idle" | "loading" | "live" | "failed";

export type PaintSettings = {
  color: string;
  metalness: number;
  roughness: number;
  clearcoatRoughness: number;
};

export type ToneMappingMode = "agx" | "aces";

type ExperienceState = {
  /**
   * Tier the device qualifies for (from the capability gate). Null while the
   * GPU check is still running.
   */
  capability: Tier | null;
  /** Steps down from `capability` after sustained low frame rate (never back up). */
  degradeSteps: number;
  /** The canvas can't be seen (tab hidden, or scrolled past <main>): stop rendering. */
  hidden: boolean;
  /** The closing fade has fully covered the canvas: stop rendering. */
  faded: boolean;
  status: ExperienceStatus;
  debug: boolean;
  /** ?debug: orbit controls instead of the scroll camera. */
  freeCamera: boolean;

  paint: PaintSettings;
  /** Emissive intensity of the lamp material (DRL / tail lamps). */
  lampIntensity: number;
  environmentIntensity: number;
  exposure: number;
  toneMapping: ToneMappingMode;
  showBadges: boolean;

  setCapability: (tier: Tier | null) => void;
  setHidden: (hidden: boolean) => void;
  setFaded: (faded: boolean) => void;
  degrade: () => void;
  setStatus: (status: ExperienceStatus) => void;
  setDebug: (debug: boolean) => void;
  setPaint: (paint: Partial<PaintSettings>) => void;
  set: (
    values: Partial<
      Pick<ExperienceState, "lampIntensity" | "environmentIntensity" | "exposure" | "toneMapping" | "showBadges" | "freeCamera">
    >,
  ) => void;
};

/**
 * Shared state for the 3D experience. Low-frequency values only (settings,
 * status): components read them with selectors. Per-frame values live in the
 * motion proxy (src/lib/motion/state.ts).
 */
export const useExperience = create<ExperienceState>()((set) => ({
  capability: null,
  degradeSteps: 0,
  hidden: false,
  faded: false,
  status: "idle",
  debug: false,
  freeCamera: false,

  // Graphite: dark enough for the studio cards to model the body.
  paint: {
    color: defaultFinish.color,
    metalness: defaultFinish.metalness,
    roughness: defaultFinish.roughness,
    clearcoatRoughness: defaultFinish.clearcoatRoughness,
  },
  lampIntensity: 2.5,
  environmentIntensity: 1,
  exposure: 1.05,
  toneMapping: "agx",
  showBadges: siteConfig.showBadges,

  setCapability: (capability) => set({ capability }),
  degrade: () => set((state) => ({ degradeSteps: state.degradeSteps + 1 })),
  setHidden: (hidden) => set({ hidden }),
  setFaded: (faded) => set({ faded }),
  setStatus: (status) => set({ status }),
  setDebug: (debug) => set({ debug }),
  setPaint: (paint) => set((state) => ({ paint: { ...state.paint, ...paint } })),
  set: (values) => set(values),
}));

/**
 * Effective tier: the capability, stepped down once per sustained frame-rate
 * drop (high → medium → low; low stays low rather than dropping the canvas).
 */
export const selectTier = (state: ExperienceState): Tier => {
  const { capability, degradeSteps } = state;
  if (!capability || capability === "off") return "off";
  const index = renderTiers.indexOf(capability);
  return renderTiers[Math.max(0, index - degradeSteps)];
};
