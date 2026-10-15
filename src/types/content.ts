/**
 * Content contracts.
 *
 * Every factual claim and every piece of media on the site must carry its
 * provenance. These types make that a compile-time requirement instead of a
 * convention.
 */

import type { Locale } from "@/content/copy/types";

/** Text in every locale. */
export type Localized = Record<Locale, string>;
/** A plain string reads the same in every locale (figures, model codes, grade names). */
export type Text = string | Localized;

/** Markets with a recorded source. Display names live in the copy (vehicle.markets). */
export type MarketId = "japan";

/** Where a fact came from. Required for every specification shown. */
export type SourceReference = {
  title: string;
  url: string;
  /** ISO date (YYYY-MM-DD) the source was checked. */
  retrievedAt: string;
  /** Edition printed on the document (e.g. "2025-03"), so figures from different editions can't be mixed silently. */
  edition: string;
  /**
   * The market the figure applies to. LC300 specifications differ by market
   * (engine, trim, equipment), and vehicles reach Mongolia from several
   * export markets, so a figure without a market is ambiguous.
   */
  market: MarketId;
};

/** A value that differs by grade, with the grades it applies to. */
export type SpecVariant = { grades: Text; value: Text };

/** A verified figure. Never hard-code one in the UI or the copy. */
export type VehicleSpec = {
  id: string;
  label: Localized;
  /** One value for every grade in the source, or one per grade group. */
  value: Text | readonly SpecVariant[];
  /** Qualifier printed with the figure in the source (test method, how it was measured). */
  note?: Localized;
  source: SourceReference;
};

/** As marked in the source's equipment table. */
export type Availability = "standard" | "factory-option" | "dealer-option";

/** A piece of equipment. Grades not listed in `availability` don't offer it. */
export type VehicleFeature = {
  id: string;
  label: Localized;
  availability: readonly { grades: Text; status: Availability; detail?: Text }[];
  note?: Localized;
  source: SourceReference;
};

export type MediaLicense = {
  /** Photographer, studio, or rights holder. */
  credit: string;
  /** e.g. "Commissioned — full rights", "Toyota press kit — editorial use". */
  terms: string;
  /** Link to the licence agreement or press-kit terms, when available. */
  url?: string;
};

export type ImageAsset = {
  kind: "image";
  /** Path under /public, e.g. "/media/vehicle/hero-exterior.jpg". */
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * "render": a still rendered from the project's licensed 3D model (a CC
   * BY-NC-SA adaptation, credited like the model). "photograph": real
   * photography. A render never fills a photography slot (docs/ASSETS.md).
   */
  origin: "photograph" | "render";
  license: MediaLicense;
  /** Focal point for object-position, e.g. "50% 60%". */
  focus?: string;
  /**
   * Art-directed crop for portrait viewports (phones), from the same
   * source and under the same licence. Same alt text.
   */
  portrait?: { src: string; width: number; height: number };
};

/**
 * A named slot in the design that expects a specific piece of media.
 * `asset` stays null until a properly licensed file is supplied; the UI then
 * renders an explicit "pending" frame rather than a stand-in visual.
 */
export type MediaSlot = {
  id: string;
  /** Art-direction brief for the photographer / 3D artist. */
  brief: string;
  /** Intended aspect ratio, e.g. "16 / 9". */
  aspect: string;
  asset: ImageAsset | null;
};
