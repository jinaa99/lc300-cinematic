/**
 * Site copy contract. Every locale implements SiteCopy in full, so a missing
 * translation is a type error rather than a blank on the page.
 *
 * Copy is editorial: it may describe places, light and mood, but it states no
 * vehicle facts. Specifications come only from src/content/vehicle.ts, with
 * their source.
 */

export type Locale = "en" | "mn";

/** In-page chapters, in page order. Their ids double as anchors (#design …). */
export const chapterIds = ["design", "light", "terrain", "interior", "performance", "colour", "contact"] as const;
export type ChapterId = (typeof chapterIds)[number];

export type ChapterCopy = {
  /** Small label above the title, e.g. "01 — Design". */
  eyebrow: string;
  title: string;
  body: string;
};

export type FinishId = "graphite" | "pearl" | "black" | "silver" | "bronze";

export type SiteCopy = {
  skipToContent: string;
  /** Accessible name of the 3D loading indicator. */
  loading3d: string;
  nav: { label: string; items: Record<ChapterId, string> };
  hero: {
    eyebrow: string;
    /** Display title, one entry per line. */
    titleLines: string[];
    lede: string;
    scrollCue: string;
  };
  design: ChapterCopy;
  light: ChapterCopy;
  terrain: ChapterCopy & {
    /** Short place notes shown as a list. */
    notes: string[];
  };
  interior: ChapterCopy;
  performance: ChapterCopy & {
    /** Shown while vehicleSpecs is empty. */
    pending: string;
    /** Heading for a group of figures; receives the market name. */
    marketHeading: (market: string) => string;
    sourceLabel: string;
    checkedLabel: string;
    /** Labels by VehicleSpec.id; falls back to the spec's own label. */
    labels: Record<string, string>;
    /** Figures not yet verified from an official source. */
    missing: string[];
    missingNote: string;
  };
  colour: ChapterCopy & {
    finishes: Record<FinishId, string>;
    /** Accessible name of the turntable control (drag / arrow keys). */
    rotateLabel: string;
    rotateHint: string;
    pickerLabel: string;
    /** Under the swatches: these are studio finishes, not paint codes. */
    note: string;
    /** When the 3D layer isn't running (no JS, reduced motion, low power). */
    unavailable: string;
  };
  contact: ChapterCopy & {
    cta: string;
    backToTop: string;
    /** Shown while no contact link is configured. */
    unavailable: string;
  };
};
