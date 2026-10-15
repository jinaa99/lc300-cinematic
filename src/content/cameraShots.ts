/**
 * Scroll-driven shot list for the 3D layer, as data.
 *
 * Each key pins a full look (camera + scene) to a scroll position: `chapter`
 * is the section id, `at` is the progress through that section's pinned
 * range (0 = section reaches the top, 1 = it is about to leave). Negative
 * `at` is during the section's entry (-1 = one viewport before it reaches
 * the top), for waypoints between chapters. The master
 * timeline (ScrollDirector) tweens between consecutive keys; the camera
 * follows a centripetal Catmull–Rom curve through every key's position (and
 * a second one through the targets), so it never cuts or jumps.
 *
 * Space: metres, +Y up, vehicle front +Z, driver's left +X, origin on the
 * ground under the vehicle's centre. Use ?debug → "copy camera" to author.
 *
 * Keep this file free of runtime imports: scripts/check-camera-path.mjs
 * reads it with Node's type stripping.
 */

export type Vec3 = [number, number, number];

/** Everything the timeline animates. Numbers only, so GSAP can tween it. */
export type Look = {
  /** Vertical field of view, degrees. */
  fov: number;
  /** Lens shift as a fraction of the viewport (+x: subject right, +y: subject down). */
  shiftX: number;
  shiftY: number;
  /** 0 = dark studio, 1 = Mongolian steppe at dusk. */
  steppe: number;
  /** 0 = as lit, 1 = night (environment and lightformers dimmed). */
  night: number;
  /** Multiplier on environment (reflection) intensity. */
  envIntensity: number;
  /** Rim lightformer behind the vehicle. */
  rim: number;
  /** Headlamp / DRL emissive intensity. */
  lamp: number;
  /** Tail lamp emissive intensity. */
  tail: number;
  /** 0 = full frame, 1 = 2.39:1 letterbox. */
  letterbox: number;
  /** Depth of field amount (bokeh scale multiplier). High tier, Light and Interior shots only. */
  dof: number;
  /** Depth-of-field focus point. */
  focusX: number;
  focusY: number;
  focusZ: number;
  /** Bloom intensity (post-processing tiers). */
  bloom: number;
  /** Vignette darkness. */
  vignette: number;
  /** Film grain opacity. */
  noise: number;
  /** Handheld camera drift, 0..1 (simplex noise; off in reduced motion). */
  handheld: number;
  /** Wheel spin, radians per second (on top of rolling from `carZ`). */
  spin: number;
  /** Vehicle travel along +Z, metres (wheels roll to match). */
  carZ: number;
  /** 0..1 weight of the turntable (auto-rotation + user drag). */
  turntable: number;
  /** Dust particle density, 0..1 (not on the low tier). */
  dust: number;
  /** Cabin glass opacity multiplier; lowered while the camera passes through glass. */
  glass: number;
  /** Fade to ink, 0..1. */
  fade: number;
  /**
   * How much the portrait (phone) framing applies: wider lens, pulled back,
   * subject in the upper half. 0 inside the cabin, where pulling back would
   * leave the vehicle.
   */
  portrait: number;
  /**
   * Vertical lens shift on stacked (phone) layouts, where the text sits
   * under the vehicle (negative: subject up). Replaces shiftY there.
   */
  stackY: number;
};

export type ShotKey = {
  chapter: "hero" | "design" | "light" | "terrain" | "interior" | "performance" | "colour" | "contact";
  at: number;
  position: Vec3;
  target: Vec3;
  /** Easing token from src/lib/motion/tokens.ts for the move INTO this key. */
  ease?: "cinematic" | "drift" | "linear";
  look?: Partial<Look>;
};

export const baseLook: Look = {
  fov: 32,
  shiftX: 0.2,
  shiftY: 0.12,
  steppe: 0,
  night: 0,
  envIntensity: 1,
  rim: 1,
  lamp: 2.5,
  tail: 0.8,
  letterbox: 0,
  dof: 0,
  focusX: 0.62,
  focusY: 0.98,
  focusZ: 2.3,
  bloom: 0.35,
  vignette: 0.55,
  noise: 0.03,
  handheld: 1,
  spin: 0,
  carZ: 0,
  turntable: 0,
  dust: 0,
  glass: 1,
  fade: 0,
  portrait: 1,
  stackY: -0.22,
};

/**
 * Keys inherit the previous key's look (starting from baseLook), so each
 * key only states what changes.
 */
export const shotKeys: ShotKey[] = [
  // Hero: dark studio, low three-quarter front, rim and lamps come up on load.
  // Full frame (no letterbox): the bars cut through the title block. On
  // phones the vehicle sits lower, closer to the title under it.
  {
    chapter: "hero",
    at: 0,
    position: [7.4, 0.8, 8.2],
    target: [0, 0.85, 0.1],
    look: { shiftY: 0.14, stackY: -0.13 },
  },
  // Design: half-orbit from the front round to the flank, rising.
  {
    chapter: "design",
    at: 0,
    position: [3.2, 1.0, 8.8],
    target: [0, 0.9, 0.3],
    ease: "cinematic",
    look: { shiftY: 0.08, stackY: -0.22 },
  },
  // Distances keep the vehicle inside the right two thirds, clear of the
  // text column and of the frame edge, as it turns side-on.
  { chapter: "design", at: 0.5, position: [8.2, 1.4, 7.0], target: [0, 0.95, 0], ease: "drift" },
  { chapter: "design", at: 1, position: [10.7, 2.0, 0.5], target: [0, 0.9, -0.1], ease: "drift", look: { shiftX: 0.22 } },
  // Light: macro push to the headlamp; lamps from 0 to 8, depth of field, bloom.
  {
    chapter: "light",
    at: 0,
    position: [5.1, 1.3, 6.0],
    target: [0.55, 0.95, 2.0],
    ease: "cinematic",
    look: { fov: 28, lamp: 0, envIntensity: 0.55, shiftX: 0.2, shiftY: 0.04 },
  },
  {
    chapter: "light",
    at: 1,
    position: [1.4, 1.03, 3.25],
    target: [0.62, 0.98, 2.3],
    ease: "drift",
    look: { fov: 24, lamp: 8, dof: 1, bloom: 0.9, shiftX: 0.1, shiftY: 0 },
  },
  // Terrain: studio dissolves into steppe dusk; wheel-height tracking, wheels turning, dust.
  {
    chapter: "terrain",
    at: 0,
    position: [5.9, 0.5, 6.8],
    target: [0.4, 0.6, 0.2],
    ease: "cinematic",
    look: { fov: 30, steppe: 1, lamp: 2.5, envIntensity: 1, dof: 0, bloom: 0.35, spin: 6, dust: 0.6, shiftX: 0.26, shiftY: 0.05 },
  },
  // Wide of the flank mid-track, so the headline stays clear of the wheels.
  { chapter: "terrain", at: 0.5, position: [8.5, 0.45, 2.0], target: [0.5, 0.55, 0.6], ease: "linear", look: { spin: 7, dust: 0.8 } },
  {
    chapter: "terrain",
    at: 1,
    position: [3.9, 0.4, -3.0],
    target: [0.6, 0.5, 1.0],
    ease: "linear",
    look: { spin: 8, dust: 1 },
  },
  // Interior: in through the windshield on the driver's side (clear of the
  // mirror at x ±0.13), low over the dashboard, to between the front seats,
  // turning to face the dashboard. Cabin clearance is checked by
  // scripts/check-camera-path.mjs.
  {
    chapter: "interior",
    at: 0,
    position: [0.6, 1.85, 4.2],
    target: [0, 1.35, -0.2],
    ease: "cinematic",
    look: { fov: 34, spin: 0, dust: 0, shiftX: 0, shiftY: 0 },
  },
  {
    chapter: "interior",
    at: 0.35,
    position: [0.32, 1.66, 1.45],
    target: [0.1, 1.4, -1.2],
    ease: "drift",
    look: { fov: 40, glass: 0.15, portrait: 0, handheld: 0.4, dof: 0.35, focusX: 0, focusY: 1.2, focusZ: -0.6 },
  },
  { chapter: "interior", at: 0.6, position: [0.3, 1.56, 0.62], target: [0, 1.35, -1.5], ease: "drift", look: { fov: 50 } },
  {
    chapter: "interior",
    at: 1,
    position: [0.1, 1.5, -0.3],
    target: [0.38, 1.22, 1.0],
    ease: "drift",
    look: { fov: 55, dof: 0.5, focusX: 0.38, focusY: 1.25, focusZ: 0.75 },
  },
  // Performance: back out through the windshield, over the roof into the
  // night; low from behind, tail lamps, the vehicle creeps forward.
  {
    chapter: "performance",
    at: 0,
    position: [0.3, 1.57, 0.7],
    target: [0.2, 1.2, 3],
    ease: "drift",
    look: { fov: 45, steppe: 0, night: 0.5, dof: 0 },
  },
  {
    chapter: "performance",
    at: 0.2,
    position: [0.3, 1.95, 1.7],
    target: [0, 1.2, -1],
    ease: "drift",
    // portrait stays 0 until the camera is well clear of the cabin: the
    // narrow-screen pull-back moves away from the aim point, which here is
    // ahead of the camera.
    look: { fov: 36, glass: 1, handheld: 1 },
  },
  { chapter: "performance", at: 0.4, position: [-1.6, 2.8, -1.2], target: [0, 0.9, -2.5], ease: "drift", look: { fov: 32, portrait: 1 } },
  {
    chapter: "performance",
    at: 0.65,
    position: [-2.6, 0.45, -6.6],
    target: [0, 0.85, -1.2],
    ease: "cinematic",
    look: { fov: 30, night: 1, tail: 6, lamp: 3, bloom: 0.6, vignette: 0.7, shiftX: 0.25, shiftY: 0.06 },
  },
  { chapter: "performance", at: 1, position: [-2.4, 0.42, -6.2], target: [0, 0.85, 0], ease: "linear", look: { carZ: 2.2 } },
  // Round the front, wide of the vehicle, back to the studio.
  { chapter: "colour", at: -0.6, position: [-6.8, 1.6, 0.5], target: [0, 0.85, 1], ease: "drift", look: { night: 0.5, carZ: 0.8 } },
  { chapter: "colour", at: -0.3, position: [-3.5, 1.6, 8.5], target: [0, 0.85, 0.5], ease: "drift" },
  // Colour: back in the studio, on a turntable the visitor can turn.
  {
    chapter: "colour",
    at: 0,
    position: [6.6, 1.5, 7.2],
    target: [0, 0.85, 0],
    ease: "cinematic",
    look: { night: 0, tail: 0.8, lamp: 2.5, carZ: 0, turntable: 1, bloom: 0.35, vignette: 0.55, shiftX: 0.2, shiftY: 0.1 },
  },
  { chapter: "colour", at: 1, position: [6.2, 1.6, 7.0], target: [0, 0.85, 0], ease: "drift" },
  // Contact: pull back to the full silhouette, fade.
  {
    chapter: "contact",
    at: 0,
    position: [9.5, 2.0, 10.5],
    target: [0, 0.9, 0],
    ease: "cinematic",
    look: { turntable: 0, rim: 2.5, envIntensity: 0.35, lamp: 1.5, vignette: 0.75 },
  },
  { chapter: "contact", at: 1, position: [12.5, 2.6, 13.5], target: [0, 0.9, 0], ease: "drift", look: { fade: 1 } },
];

/** Keys with their looks fully resolved (each inherits from the one before). */
export function resolvedKeys(): Array<ShotKey & { look: Look }> {
  let look = baseLook;
  return shotKeys.map((key) => {
    look = { ...look, ...key.look };
    return { ...key, look };
  });
}
