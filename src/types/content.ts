/**
 * Content contracts.
 *
 * Every factual claim and every piece of media on the site must carry its
 * provenance. These types make that a compile-time requirement instead of a
 * convention.
 */

/** Where a fact came from. Required for every specification shown. */
export type SourceReference = {
  title: string;
  url: string;
  /** ISO date (YYYY-MM-DD) the source was checked. */
  retrievedAt: string;
  /**
   * The market the figure applies to. LC300 specifications differ by market
   * (engine, trim, equipment), and vehicles reach Mongolia from several
   * export markets, so a figure without a market is ambiguous.
   */
  market: string;
};

export type VehicleSpec = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  /** Trim / grade the value applies to, when it is not universal. */
  grade?: string;
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
  license: MediaLicense;
  /** Focal point for object-position, e.g. "50% 60%". */
  focus?: string;
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
