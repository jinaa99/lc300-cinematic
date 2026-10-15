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
    asset: null,
  },
} satisfies Record<string, MediaSlot>;
