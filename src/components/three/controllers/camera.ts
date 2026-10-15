import { easing } from "maath";
import { CatmullRomCurve3, MathUtils, type PerspectiveCamera, Vector3 } from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { resolvedKeys } from "@/content/cameraShots";
import { activity, cameraProbe, motion, motionMode } from "@/lib/motion/state";

/** Seconds to (approximately) settle; the feel of the camera. */
const SMOOTH = 0.45;
/** Shots are framed for 16:9; narrower screens keep that horizontal field. */
const REFERENCE_ASPECT = 16 / 9;
/**
 * Stacked (phone) layouts: the text sits below the vehicle instead of beside
 * it, so the 16:9 field's room for the text column is not needed. A narrower
 * reference lets the vehicle fill most of the width instead of ~40% of it.
 */
const STACKED_REFERENCE_ASPECT = 1.15;
/** Widest vertical fov used to fit; beyond it the camera pulls back instead. */
const MAX_FIT_FOV = 58;
/** Below the md breakpoint the text stacks under the vehicle (see StickyChapter). */
const STACKED_WIDTH = 768;
/** Handheld drift: peak rotation (radians) and speed (noise units per second). */
const HANDHELD_ANGLE = 0.0026;
const HANDHELD_SPEED = 0.22;

const round = (v: Vector3) => v.toArray().map((n) => +n.toFixed(3)) as [number, number, number];

/**
 * Per-frame camera driver (plain object, so the scene graph can be mutated
 * outside React's render rules).
 *
 * Position: the proxy's `path` parameter is damped, then evaluated on the
 * centripetal Catmull–Rom curve through every shot key. Damping the
 * parameter (not the position) keeps the camera exactly on the authored
 * path, which matters inside the cabin, where cutting a corner would clip
 * (clearance is verified by scripts/check-camera-path.mjs).
 * Aim: the look-at point is damped with damp3. Lens: fov and shift damped.
 *
 * Narrow screens: the 16:9 horizontal field is kept so the whole vehicle
 * stays in frame (a narrower one on stacked phone layouts). The vertical fov
 * widens up to MAX_FIT_FOV and the camera pulls back for the rest, weighted
 * by the shot's `portrait` value (0 inside the cabin). On stacked (phone)
 * layouts the subject moves to the upper half.
 *
 * Handheld: a very small simplex-noise rotation on top, scaled by the shot's
 * `handheld` value; none in reduced-motion (snap) mode.
 */
export function createCameraController() {
  const keys = resolvedKeys();
  const positions = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.position)), false, "centripetal");
  const targets = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.target)), false, "centripetal");
  const damped = { t: 0, fov: keys[0].look.fov, shiftX: keys[0].look.shiftX, shiftY: keys[0].look.shiftY };
  const aim = new Vector3(...keys[0].target);
  const position = new Vector3();
  const target = new Vector3();
  let first = true;
  const simplex = new SimplexNoise();
  let clock = 0;

  // Busy until the damped values have caught up with the proxy.
  const busy = () =>
    Math.abs(damped.t - motion.path) > 1e-5 ||
    Math.abs(damped.fov - motion.fov) > 1e-3 ||
    Math.abs(damped.shiftX - motion.shiftX) > 1e-4 ||
    Math.abs(damped.shiftY - motion.shiftY) > 1e-4 ||
    aim.distanceToSquared(target) > 1e-8;

  return {
    /** Registers the busy check while mounted; returns the cleanup. */
    track() {
      activity.add(busy);
      return () => void activity.delete(busy);
    },

    /** Initial look-at point (for orbit controls in ?debug). */
    initialTarget: keys[0].target,

    /** ?debug free camera: record where the visitor has flown to. */
    probe(camera: PerspectiveCamera, orbitTarget: Vector3 | undefined) {
      cameraProbe.position = round(camera.position);
      if (orbitTarget) cameraProbe.target = round(orbitTarget);
      cameraProbe.fov = +camera.fov.toFixed(1);
    },

    update(camera: PerspectiveCamera, width: number, height: number, delta: number) {
      const snap = motionMode.snap || first;
      const dt = Math.min(delta, 0.1);
      first = false;
      clock += dt;

      if (snap) {
        damped.t = motion.path;
        damped.fov = motion.fov;
        damped.shiftX = motion.shiftX;
        damped.shiftY = motion.shiftY;
      } else {
        easing.damp(damped, "t", motion.path, SMOOTH, dt);
        easing.damp(damped, "fov", motion.fov, SMOOTH, dt);
        easing.damp(damped, "shiftX", motion.shiftX, SMOOTH, dt);
        easing.damp(damped, "shiftY", motion.shiftY, SMOOTH, dt);
      }

      positions.getPoint(damped.t, position);
      targets.getPoint(damped.t, target);
      if (snap) aim.copy(target);
      else easing.damp3(aim, target, SMOOTH * 0.8, dt);

      // Fit narrow screens: keep the 16:9 horizontal field (narrower when stacked).
      const aspect = width / height;
      const weight = motion.portrait;
      const reference = width < STACKED_WIDTH ? STACKED_REFERENCE_ASPECT : REFERENCE_ASPECT;
      let fov = damped.fov;
      if (aspect < reference && weight > 0) {
        const halfWidth = Math.tan(MathUtils.degToRad(fov / 2)) * reference;
        const neededFov = MathUtils.radToDeg(2 * Math.atan(halfWidth / aspect));
        const fitFov = Math.min(neededFov, MAX_FIT_FOV);
        const pull = halfWidth / (Math.tan(MathUtils.degToRad(fitFov / 2)) * aspect);
        fov = MathUtils.lerp(fov, fitFov, weight);
        position.sub(aim).multiplyScalar(MathUtils.lerp(1, pull, weight)).add(aim);
      }
      const stacked = width < STACKED_WIDTH ? weight : 0;
      const shiftX = damped.shiftX * (1 - stacked);
      const shiftY = MathUtils.lerp(damped.shiftY, -0.22, stacked);

      camera.position.copy(position);
      camera.lookAt(aim);

      // Handheld drift.
      const amount = snap || motionMode.still ? 0 : HANDHELD_ANGLE * motion.handheld;
      if (amount > 0) {
        const t = clock * HANDHELD_SPEED;
        camera.rotateX(simplex.noise(t, 0.0) * amount);
        camera.rotateY(simplex.noise(t, 7.3) * amount);
        camera.rotateZ(simplex.noise(t, 13.1) * amount * 0.5);
      }

      camera.fov = fov;
      camera.setViewOffset(width, height, -shiftX * width, -shiftY * height, width, height);
      camera.updateProjectionMatrix();
    },
  };
}
