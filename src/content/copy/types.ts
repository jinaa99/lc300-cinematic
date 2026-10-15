/**
 * Site copy contract. Every locale implements SiteCopy in full, so a missing
 * translation is a type error rather than a blank on the page.
 *
 * Copy is editorial: it may describe places, light and mood, but it states no
 * vehicle facts. Specifications come only from src/content/vehicle.ts, with
 * their source.
 */

import type { Availability, MarketId } from "@/types/content";

export const locales = ["en", "mn"] as const;
export type Locale = (typeof locales)[number];

/** In-page chapters, in page order. Their ids double as anchors (#design …). */
export const chapterIds = [
  "design",
  "light",
  "terrain",
  "interior",
  "performance",
  "colour",
  "contact",
  "specifications",
] as const;
export type ChapterId = (typeof chapterIds)[number];

export type ChapterCopy = {
  /** Small label above the title, e.g. "01 — Design". */
  eyebrow: string;
  title: string;
  body: string;
};

export type FinishId = "graphite" | "pearl" | "black" | "silver" | "bronze";

/** Headed blocks of the vehicle information section, in page order. */
export const vehicleGroupIds = ["engine", "dimensions", "interior", "safety", "offroad", "variants", "sources"] as const;
export type VehicleGroupId = (typeof vehicleGroupIds)[number];

export type SiteCopy = {
  meta: {
    /** Default document title. */
    title: string;
    description: string;
    /** Open Graph locale, e.g. "en_US". */
    ogLocale: string;
  };
  language: {
    /** Accessible name of the language switcher. */
    label: string;
    /** Each language's name, written in that language. */
    names: Record<Locale, string>;
  };
  skipToContent: string;
  /** Accessible name of the 3D loading indicator. */
  loading3d: string;
  nav: {
    label: string;
    items: Record<ChapterId, string>;
    /** Mobile menu button (below lg, where the inline nav is hidden). */
    open: string;
    close: string;
  };
  hero: {
    eyebrow: string;
    /** Display title, one entry per line. */
    titleLines: string[];
    lede: string;
    /** Above-the-fold statement that the site is a non-commercial concept (model licence: CC BY-NC-SA). */
    concept: string;
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
    sourceLabel: string;
    checkedLabel: string;
    /** Which vehicle the 3D model depicts, versus the market of the figures. */
    modelNote: string;
    /** Link to the vehicle information section. */
    fullSpecs: string;
    /** Figures not yet verified from an official source. */
    missing: string[];
    missingNote: string;
  };
  colour: ChapterCopy & {
    finishes: Record<FinishId, string>;
    /** Accessible name of the turntable control (drag / arrow keys). */
    rotateLabel: string;
    rotateHint: string;
    /** Touch screens: no arrow keys, so the hint only mentions dragging. */
    rotateTouchHint: string;
    /** Step buttons under the swatches. */
    rotateLeft: string;
    rotateRight: string;
    pickerLabel: string;
    /** Under the swatches: these are studio finishes, not paint codes. */
    note: string;
    /** While the 3D layer is still loading on a capable device. */
    loading: string;
    /** When the 3D layer isn't running (no JS, reduced motion, low power, failure). */
    unavailable: string;
  };
  contact: ChapterCopy & {
    cta: string;
    backToTop: string;
    /** Shown while no contact link is configured (NEXT_PUBLIC_CONTACT_HREF). */
    unavailable: string;
  };
  /**
   * Vehicle information appendix after the film. Editorial text only: every
   * figure and piece of equipment comes from src/content/vehicle.ts.
   */
  vehicle: ChapterCopy & {
    /** Introduction to the model (editorial, no figures). */
    intro: string[];
    /** Label over the verified part, and how it was compiled. */
    verifiedLabel: string;
    verifiedNote: string;
    /** Label over the editorial part. */
    editorialLabel: string;
    groups: Record<VehicleGroupId, { title: string; intro: string }>;
    markets: Record<MarketId, string>;
    /** "Japan market · March 2025 edition": shown on every block of figures. */
    scope: (market: string, edition: string) => string;
    /** Formats a source edition ("2025-03") for display. */
    edition: (edition: string) => string;
    availability: Record<Availability, string>;
    equipmentNote: string;
    gradeTable: { caption: string; grade: string; engine: string; seats: string; modelCode: string };
    /** Market differences: editorial, no figures. */
    differences: string[];
    notSourcedTitle: string;
    notSourced: string[];
    sourceFields: { document: string; market: string; edition: string; checked: string };
    /** Why prices from the source are left out. */
    pricesNote: string;
  };
  footer: {
    /** Licence status of the project, shown first in the footer. */
    concept: string;
    disclaimer: string;
    /** Prefix of the model attribution, e.g. "3D model:". */
    modelLabel: string;
    by: string;
    /** Upstream credit stated on the model page. */
    basedOn: string;
    licensedUnder: string;
    /** The changes made to the model (CC BY requires indicating them). */
    changes: string;
    /** Link to public/models/lc300.LICENSE.txt. */
    licenseFile: string;
  };
  error: { title: string; body: string; retry: string };
  notFound: { title: string; body: string; home: string };
};
