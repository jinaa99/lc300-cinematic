import { type ChapterId, chapterIds } from "@/content/copy/types";

/**
 * The contact link must be a mailto: or https: URL. A malformed value fails
 * the build instead of shipping a broken CTA.
 */
function contactLink(value: string | undefined): string | null {
  if (!value) return null;
  if (!/^(mailto:\S+@\S+|https:\/\/\S+)$/.test(value)) {
    throw new Error(`NEXT_PUBLIC_CONTACT_HREF must be a mailto: or https:// URL, got "${value}".`);
  }
  return value;
}

export type NavItem = {
  /** Chapter id; the label comes from the locale copy (nav.items). */
  id: ChapterId;
  /** In-page anchor (e.g. "#design") or route. */
  href: string;
};

export const siteConfig = {
  name: "LC300 Cinematic",
  /**
   * Primary navigation. Add an item only when its section exists on the page,
   * so the header never links to nothing.
   */
  nav: chapterIds.map((id): NavItem => ({ id, href: `#${id}` })),
  /**
   * Contact link for the closing CTA (mailto: or a portfolio page), from
   * NEXT_PUBLIC_CONTACT_HREF. Null until provided; the section then says
   * contact details will follow. Never a sales or lead form: the site is
   * non-commercial.
   */
  contactHref: contactLink(process.env.NEXT_PUBLIC_CONTACT_HREF),
  /**
   * Show the manufacturer badges on the 3D model (nodes with extras.badge in
   * public/models/lc300.glb). Badges on the vehicle depict the product; they
   * are never used as this site's own branding (see docs/ASSETS.md).
   */
  showBadges: true,
  /**
   * Required attribution for the 3D model (CC BY-NC-SA 4.0). The footer
   * shows it once `author` and `url` are filled. The connecting phrases
   * (based on, changes) are translated in the copy (footer). Keep it in sync
   * with public/models/lc300.LICENSE.txt and docs/ASSETS.md.
   */
  modelCredit: {
    title: "2022 Toyota Land Cruiser 300 VX.R",
    author: "Ddiaz Design" as string | null,
    url: "https://sketchfab.com/3d-models/2022-toyota-land-cruiser-300-vxr-3dfcd7904cdb4e52afa3ce59fa59e1a5" as string | null,
    license: "CC BY-NC-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    /** Full attribution and licence notice, shipped next to the GLB. */
    noticeUrl: "/models/lc300.LICENSE.txt",
  },
} as const;

/** Canonical origin, used for metadata. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);
