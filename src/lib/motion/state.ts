import { baseLook, type Look, type Vec3 } from "@/content/cameraShots";

/**
 * The scroll proxy: a plain object the GSAP master timeline tweens (scrubbed
 * by scroll) and the canvas reads every frame. Not React state: nothing here
 * triggers a render.
 *
 * `path` is the parameter along the camera curves (key i sits at
 * i / (keys - 1)); everything else is the current Look.
 */
export const motion: Look & { path: number } = { path: 0, ...baseLook };

/** Load-in: rim light and lamps come up once the experience is live (0 → 1). */
export const intro = { value: 0 };

/**
 * snap: reduced-motion mode; the director snaps between static chapter
 * frames and the canvas applies them without damping.
 * still: no idle motion (handheld drift off), for the on-demand low tier.
 * invalidate: requests a frame when the canvas renders on demand (low tier);
 * set by the canvas, called by anything that changes the picture.
 */
export const motionMode: { snap: boolean; still: boolean; invalidate: (() => void) | null } = {
  snap: false,
  still: false,
  invalidate: null,
};

/**
 * "Still moving?" checks from the per-frame controllers. With on-demand
 * rendering the canvas keeps requesting frames while any of them is true.
 */
export const activity = new Set<() => boolean>();

/** Turntable input from the Colour chapter (drag / arrow keys), radians. */
export const turntableInput = { yaw: 0 };

/** ?debug: the live camera, for copying into src/content/cameraShots.ts. */
export const cameraProbe = {
  position: [0, 0, 0] as Vec3,
  target: [0, 0, 0] as Vec3,
  fov: 0,
};
