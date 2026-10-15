export type NavItem = {
  label: string;
  /** In-page anchor (e.g. "#design") or route. */
  href: string;
};

export const siteConfig = {
  name: "LC300 Cinematic",
  description:
    "A cinematic, scroll-driven presentation of the Toyota Land Cruiser 300, designed as a concept for a Mongolian vehicle importer.",
  /** Shown in the footer until a real importer is attached to the project. */
  disclaimer:
    "Independent design concept. Not affiliated with, endorsed by, or sponsored by Toyota Motor Corporation. Land Cruiser is a trademark of Toyota Motor Corporation.",
  /**
   * Primary navigation. Add an item only when its section exists on the page,
   * so the header never links to nothing.
   */
  nav: [] as NavItem[],
} as const;

/** Canonical origin, used for metadata. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);
