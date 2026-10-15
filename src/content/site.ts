import { type ChapterId, chapterIds } from "@/content/copy/types";

export type NavItem = {
  /** Chapter id; the label comes from the locale copy (nav.items). */
  id: ChapterId;
  /** In-page anchor (e.g. "#design") or route. */
  href: string;
};

export const siteConfig = {
  name: "LC300 Cinematic",
  description:
    "A cinematic, scroll-driven presentation of the Toyota Land Cruiser 300, designed as a non-commercial portfolio concept for the Mongolian market.",
  /** Shown in the footer. The site is a non-commercial portfolio concept. */
  disclaimer:
    "Independent design concept. Not affiliated with, endorsed by, or sponsored by Toyota Motor Corporation. Land Cruiser is a trademark of Toyota Motor Corporation.",
  /**
   * Primary navigation. Add an item only when its section exists on the page,
   * so the header never links to nothing.
   */
  nav: chapterIds.map((id): NavItem => ({ id, href: `#${id}` })),
  /**
   * Contact link for the closing CTA (mailto: or a portfolio page). Null
   * until provided; the section then says contact details will follow.
   * Never a sales or lead form: the site is non-commercial.
   */
  contactHref: null as string | null,
  /**
   * Show the manufacturer badges on the 3D model (nodes with extras.badge in
   * public/models/lc300.glb). Badges on the vehicle depict the product; they
   * are never used as this site's own branding (see docs/ASSETS.md).
   */
  showBadges: true,
  /**
   * Required attribution for the 3D model (CC BY-NC-SA 4.0). The footer
   * shows it once `author` and `url` are filled. Keep it in sync with
   * public/models/lc300.LICENSE.txt and docs/ASSETS.md.
   */
  modelCredit: {
    title: "2022 Toyota Land Cruiser 300 VX.R",
    author: "Ddiaz Design" as string | null,
    url: "https://sketchfab.com/3d-models/2022-toyota-land-cruiser-300-vxr-3dfcd7904cdb4e52afa3ce59fa59e1a5" as string | null,
    license: "CC BY-NC-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    /** Upstream credit stated on the model page. */
    basedOn: "based on a Racing Master 3D model; credits: GM25",
    changes: "converted and modified for this site",
  },
} as const;

/** Canonical origin, used for metadata. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);
