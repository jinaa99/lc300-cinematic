import { easing } from "maath";
import type { Mesh, MeshPhysicalMaterial, Object3D } from "three";
import { activity, intro, motion, motionMode, turntableInput } from "@/lib/motion/state";

/** Rolling radius of the tyres, metres (from the model: Ø 0.80 m). */
const WHEEL_RADIUS = 0.4;
/** Turntable auto-rotation, radians per second. */
const TURNTABLE_SPEED = 0.18;

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

type VehicleParts = {
  root: Object3D;
  lamps: MeshPhysicalMaterial[];
  tailLamps: MeshPhysicalMaterial[];
  glassMeshes: Mesh[];
};

/**
 * Per-frame vehicle driver: travel (carZ) with matching wheel roll, free
 * wheel spin, the turntable, lamp intensities and cabin glass visibility,
 * all from the motion proxy.
 */
export function createVehicleController({ root, lamps, tailLamps, glassMeshes }: VehicleParts) {
  const wheels = ["FL", "FR", "RL", "RR"].map((id) => root.getObjectByName(`wheel_${id}`)).filter((w): w is Object3D => !!w);
  const s = { carZ: 0, roll: 0, yaw: 0, autoYaw: 0, turntable: 0 };
  const goalYaw = () => s.turntable * wrapAngle(s.autoYaw + turntableInput.yaw);
  // Busy while travelling, spinning, turning, or the lamps are fading in.
  const busy = () =>
    Math.abs(s.carZ - motion.carZ) > 1e-4 ||
    motion.spin > 0 ||
    Math.abs(s.turntable - motion.turntable) > 1e-4 ||
    s.turntable > 1e-3 ||
    Math.abs(wrapAngle(s.yaw - goalYaw())) > 1e-4 ||
    intro.value < 1;

  return {
    /** Registers the busy check while mounted; returns the cleanup. */
    track() {
      activity.add(busy);
      return () => void activity.delete(busy);
    },
    /**
     * @param group the group carrying the vehicle (travel + turntable)
     * @param lampLookDev the store's lamp multiplier (2.5 = 1×)
     */
    update(group: Object3D | null, delta: number, lampLookDev: number) {
      const dt = Math.min(delta, 0.1);
      const snap = motionMode.snap;

      const previousZ = s.carZ;
      if (snap) s.carZ = motion.carZ;
      else easing.damp(s, "carZ", motion.carZ, 0.6, dt);
      s.roll += (s.carZ - previousZ) / WHEEL_RADIUS + (snap ? 0 : motion.spin * dt);
      for (const wheel of wheels) wheel.rotation.x = s.roll;

      // Weight × (auto-rotation + visitor input), wrapped so the vehicle
      // turns the short way home when the weight drops.
      if (snap) s.turntable = motion.turntable;
      else easing.damp(s, "turntable", motion.turntable, 0.5, dt);
      if (!snap) s.autoYaw += dt * TURNTABLE_SPEED * s.turntable;
      const goal = goalYaw();
      if (snap) s.yaw = goal;
      else easing.dampAngle(s, "yaw", goal, 0.35, dt);

      if (group) {
        group.position.z = s.carZ;
        group.rotation.y = s.yaw;
      }

      const lampScale = (lampLookDev / 2.5) * intro.value;
      for (const m of lamps) m.emissiveIntensity = motion.lamp * lampScale;
      for (const m of tailLamps) m.emissiveIntensity = motion.tail * lampScale;

      const glassVisible = motion.glass > 0.5;
      for (const mesh of glassMeshes) mesh.visible = glassVisible;
    },
  };
}
