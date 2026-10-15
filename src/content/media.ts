import { siteConfig } from "@/content/site";
import type { MediaSlot } from "@/types/content";

/**
 * Media slots used across the site. Each one describes the shot the layout
 * was designed around. Replace `asset: null` with a licensed ImageAsset once
 * the file is in /public/media — see docs/ASSETS.md.
 */
export const mediaSlots = {
  heroExterior: {
    id: "hero-exterior",
    brief:
      "Full-bleed exterior, three-quarter front, low camera. Dusk or overcast light with controlled reflections; dark open landscape. Vehicle in the lower-right third to leave negative space for the title.",
    aspect: "16 / 9",
    // Rendered from the project's 3D model at the hero's first camera key,
    // so the poster hands over to the live canvas without a jump. Both
    // renders are CC BY-NC-SA adaptations of the model (docs/ASSETS.md).
    asset: {
      kind: "image",
      src: "/media/renders/hero-exterior-16x9.webp",
      alt: "Rendering of a Land Cruiser 300 in graphite, three-quarter front view, in a dark studio",
      width: 3840,
      height: 2160,
      // Keeps the vehicle (right of centre) when a tall viewport crops the sides.
      focus: "72% 50%",
      origin: "render",
      license: {
        credit: siteConfig.modelCredit.author ?? "Unknown author",
        terms: `Rendered from licensed 3D model (${siteConfig.modelCredit.title}); CC BY-NC-SA 4.0`,
        url: siteConfig.modelCredit.url ?? undefined,
      },
      portrait: { src: "/media/renders/hero-exterior-portrait.webp", width: 860, height: 1864 },
    },
  },
} satisfies Record<string, MediaSlot>;
