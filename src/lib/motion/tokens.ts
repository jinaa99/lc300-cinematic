/**
 * Motion tokens for JS-driven animation (GSAP timelines, Three.js camera
 * moves). Mirrors the --ease-* tokens in src/app/globals.css so CSS and JS
 * motion feel like one system.
 */

export const easing = {
  /** Long, decelerating settle — reveals, camera arrivals. */
  cinematic: [0.22, 1, 0.36, 1],
  /** Symmetric drift — loops, scrubbed parallax. */
  drift: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Durations in seconds (GSAP's unit). */
export const duration = {
  quick: 0.35,
  base: 0.8,
  slow: 1.4,
  scene: 2.4,
} as const;

/** Converts a bezier token to a CSS / GSAP CustomEase string. */
export function toCubicBezier([x1, y1, x2, y2]: readonly [number, number, number, number]) {
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}
