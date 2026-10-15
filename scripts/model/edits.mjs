/**
 * Source-texture edits applied before anything else reads the textures.
 *
 * ringFill: replaces an annulus with its rotationally symmetric profile,
 * taken (per radius, median) from angular ranges known to be clean. Used to
 * remove lettering from a tyre sidewall: the sidewall is symmetric, the
 * lettering is not. Normal maps are handled in a polar frame (radial /
 * tangential components) so the filled relief rotates with the ring.
 *
 * Angles are degrees, counter-clockwise from +X with image Y pointing up.
 * Radii are fractions of the texture width.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { detectNormalConvention } from "./textures.mjs";

const median = (values) => {
  const sorted = Float64Array.from(values).sort();
  return sorted.length ? sorted[sorted.length >> 1] : 0;
};
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const wrap = (deg) => ((deg % 360) + 360) % 360;
const inRanges = (deg, ranges) => ranges.some(([a, b]) => wrap(deg - a) <= wrap(b - a));

async function ringFill(file, out, edit, isNormal) {
  const { data, info } = await sharp(file).toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const [cx, cy] = [edit.center[0] * w, edit.center[1] * h];
  const [r0, r1] = edit.radii.map((r) => r * w);
  const feather = edit.feather ?? 1.5;
  // Image-space green direction: DirectX maps point green down.
  const greenUp = isNormal ? (await detectNormalConvention(file)).convention !== "directx" : true;

  const polar = (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = cy - (y + 0.5);
    return [Math.hypot(dx, dy), Math.atan2(dy, dx)];
  };
  /** Pixel → values in the ring's frame (normals: radial, tangential, z). */
  const toFrame = (k, theta) => {
    const v = [0, 1, 2].map((i) => data[k + i]);
    if (!isNormal) return v;
    const nx = v[0] - 127.5;
    const ny = (greenUp ? 1 : -1) * (v[1] - 127.5);
    return [nx * Math.cos(theta) + ny * Math.sin(theta), -nx * Math.sin(theta) + ny * Math.cos(theta), v[2]];
  };
  const fromFrame = (f, theta) => {
    if (!isNormal) return f;
    const nx = f[0] * Math.cos(theta) - f[1] * Math.sin(theta);
    const ny = f[0] * Math.sin(theta) + f[1] * Math.cos(theta);
    return [nx + 127.5, (greenUp ? 1 : -1) * ny + 127.5, f[2]];
  };

  // Radial profile from the clean angles (half-pixel radius bins).
  const bins = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, theta] = polar(x, y);
      if (r < r0 - feather || r > r1 + feather) continue;
      if (!inRanges((theta * 180) / Math.PI, edit.cleanAngles)) continue;
      const bin = Math.round(r * 2);
      if (!bins.has(bin)) bins.set(bin, [[], [], []]);
      const f = toFrame((y * w + x) * c, theta);
      bins.get(bin).forEach((list, i) => list.push(f[i]));
    }
  }
  const profile = new Map([...bins].map(([bin, lists]) => [bin, lists.map(median)]));

  let changed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, theta] = polar(x, y);
      const weight = smoothstep(r0 - feather, r0, r) * (1 - smoothstep(r1, r1 + feather, r));
      if (weight <= 0) continue;
      const p = profile.get(Math.round(r * 2));
      if (!p) continue;
      const k = (y * w + x) * c;
      const filled = fromFrame(p, theta);
      for (let i = 0; i < 3; i++) data[k + i] = Math.round(data[k + i] * (1 - weight) + filled[i] * weight);
      changed++;
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: c } }).png().toFile(out);
  return changed;
}

/**
 * Applies `edits` ({ T_Name: [edit, …] }) to the source textures and writes
 * the results to <buildDir>/edited/. Returns { T_Name: editedFile } and a
 * report.
 */
export async function applyTextureEdits(edits, { sourceDir, buildDir }) {
  const dir = path.join(buildDir, "edited");
  await mkdir(dir, { recursive: true });
  const files = {};
  const report = [];
  for (const [name, list] of Object.entries(edits)) {
    const src = path.join(sourceDir, `${name}.png`);
    if (!existsSync(src)) throw new Error(`Texture edit target missing: ${name}.png`);
    let current = src;
    for (const [i, edit] of list.entries()) {
      const out = path.join(dir, `${name}${i ? `.${i}` : ""}.png`);
      if (edit.type !== "ringFill") throw new Error(`Unknown texture edit "${edit.type}"`);
      const changed = await ringFill(current, out, edit, name.endsWith("_N"));
      report.push(`${name}: ${edit.type} (${edit.reason}), ${changed} px`);
      current = out;
    }
    files[name] = current;
  }
  return { files, report };
}
