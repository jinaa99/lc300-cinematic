import { BufferAttribute, BufferGeometry, CanvasTexture, Color, type Points, PointsMaterial } from "three";
import { activity, motion } from "@/lib/motion/state";

const COUNT = 600;
/** Tyre contact patches (vehicle space): x ±0.83, front z 1.56, rear z −1.30. */
const EMITTERS = [
  [0.83, 1.56],
  [-0.83, 1.56],
  [0.83, -1.3],
  [-0.83, -1.3],
] as const;
/** Dry steppe dust (scene data, not a UI colour). */
const DUST_COLOUR = new Color("#a08c74");

/** Soft round sprite, drawn once into a small canvas texture. */
function spriteTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/**
 * Dust particles kicked back from the tyres (Terrain chapter). The
 * returned update() advances the simulation; density follows motion.dust and
 * the work is skipped entirely at zero.
 */
export function createDust() {
  const positions = new Float32Array(COUNT * 3);
  // RGBA per particle: the dust colour, alpha fades over its life.
  const colors = new Float32Array(COUNT * 4);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 4));
  const material = new PointsMaterial({
    map: spriteTexture(),
    size: 0.9,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const linear = DUST_COLOUR.clone();
  // Per particle: age, lifetime, velocity. Staggered so they don't all spawn at once.
  const particles = Array.from({ length: COUNT }, () => ({ age: Math.random() * 3, life: 1, vx: 0, vy: 0, vz: 0 }));

  const busy = () => motion.dust > 0.01;

  return {
    geometry,
    material,
    /** Registers the busy check while mounted; returns the cleanup. */
    track() {
      activity.add(busy);
      return () => void activity.delete(busy);
    },
    update(points: Points | null, delta: number) {
      const density = motion.dust;
      const visible = density > 0.01;
      if (points) points.visible = visible;
      if (!visible) return;

      const dt = Math.min(delta, 0.05);
      material.opacity = 0.7 * density;

      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.life) {
          const [ex, ez] = EMITTERS[i % EMITTERS.length];
          p.age = 0;
          p.life = 1.2 + Math.random() * 1.4;
          p.vx = (Math.random() - 0.5) * 0.5 + (ex > 0 ? 0.15 : -0.15);
          p.vy = 0.12 + Math.random() * 0.35;
          p.vz = -(0.5 + Math.random() * 1.0);
          positions[i * 3] = ex + (Math.random() - 0.5) * 0.25;
          positions[i * 3 + 1] = 0.05 + Math.random() * 0.15;
          positions[i * 3 + 2] = ez + (Math.random() - 0.5) * 0.3;
        }
        const t = p.age / p.life;
        positions[i * 3] += p.vx * dt;
        positions[i * 3 + 1] += p.vy * dt;
        positions[i * 3 + 2] += p.vz * dt;
        p.vz *= 1 - 0.6 * dt; // drag
        // Dense right behind the tyre, thinning as it drifts.
        colors[i * 4] = linear.r;
        colors[i * 4 + 1] = linear.g;
        colors[i * 4 + 2] = linear.b;
        colors[i * 4 + 3] = Math.min(1, t * 8) * (1 - t) ** 1.5;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
  };
}
