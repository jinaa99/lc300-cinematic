/**
 * node --experimental-strip-types scripts/check-camera-path.mjs
 *
 * Verifies the scroll camera path (src/content/cameraShots.ts) never clips
 * into the vehicle: samples the same centripetal Catmull–Rom curve the
 * runtime uses and measures the distance from each sample to the nearest
 * triangle of the model (glass excluded: the shot fades glass while it
 * passes through). Fails if any sample is closer than CLEARANCE.
 *
 * Runs twice: at 16:9, and at a phone aspect, where the runtime keeps the
 * 16:9 horizontal field by pulling the camera back from its aim point
 * (src/components/three/controllers/camera.ts; same formula, with the look
 * interpolated linearly between keys).
 *
 * Uses the unoptimised conversion (assets-src/lc300/build/lc300.raw.glb);
 * run `npm run model:build` first.
 */
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { CatmullRomCurve3, MathUtils, Matrix4, Triangle, Vector3 } from "three";
import { resolvedKeys } from "../src/content/cameraShots.ts";
import { paths } from "./model/config.mjs";

/** Near plane (0.05 m) plus the half-diagonal of the near rectangle at fov ≤ 60°. */
const CLEARANCE = 0.1;
const SAMPLES = 1200;
const REFERENCE_ASPECT = 16 / 9;
const MAX_FIT_FOV = 58;
const PHONE_ASPECT = 390 / 844;
/** Stacked (phone) layouts keep a narrower field so the vehicle fills the width. */
const STACKED_REFERENCE_ASPECT = 1.15;
const SEE_THROUGH = /^(glass|lamp_lens|lamp_lens_red)$/;
const CELL = 0.25;

const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(path.join(paths.build, "lc300.raw.glb"));

// Triangles in world space, binned in a uniform grid.
const tris = [];
const grid = new Map();
const cellKey = (x, y, z) => `${x},${y},${z}`;
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = new Matrix4().fromArray(node.getWorldMatrix());
  for (const prim of mesh.listPrimitives()) {
    const material = prim.getMaterial()?.getName() ?? "";
    if (SEE_THROUGH.test(material)) continue;
    const pos = prim.getAttribute("POSITION");
    const idx = prim.getIndices();
    const count = idx ? idx.getCount() : pos.getCount();
    const v = [0, 0, 0];
    const at = (i) => new Vector3(...pos.getElement(idx ? idx.getScalar(i) : i, v)).applyMatrix4(m);
    for (let i = 0; i < count; i += 3) {
      const t = new Triangle(at(i), at(i + 1), at(i + 2));
      const id = tris.push({ t, label: `${node.getName()}/${material}` }) - 1;
      const lo = [t.a, t.b, t.c].reduce((a, p) => a.min(p), t.a.clone()).divideScalar(CELL).floor();
      const hi = [t.a, t.b, t.c].reduce((a, p) => a.max(p), t.a.clone()).divideScalar(CELL).floor();
      for (let x = lo.x; x <= hi.x; x++)
        for (let y = lo.y; y <= hi.y; y++)
          for (let z = lo.z; z <= hi.z; z++) {
            const k = cellKey(x, y, z);
            if (!grid.has(k)) grid.set(k, []);
            grid.get(k).push(id);
          }
    }
  }
}

const keys = resolvedKeys();
const curve = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.position)), false, "centripetal");
const aims = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.target)), false, "centripetal");
const closest = new Vector3();

function nearest(p) {
  const c = p.clone().divideScalar(CELL).floor();
  let best = { d: Infinity, label: "" };
  for (let x = c.x - 1; x <= c.x + 1; x++)
    for (let y = c.y - 1; y <= c.y + 1; y++)
      for (let z = c.z - 1; z <= c.z + 1; z++)
        for (const id of grid.get(cellKey(x, y, z)) ?? []) {
          tris[id].t.closestPointToPoint(p, closest);
          const d = closest.distanceTo(p);
          if (d < best.d) best = { d, label: tris[id].label };
        }
  return best;
}

/** Camera position at curve parameter u for a viewport aspect (mirrors controllers/camera.ts). */
function cameraAt(u, segment, local, aspect) {
  const p = curve.getPoint(u);
  const reference = aspect < 1 ? STACKED_REFERENCE_ASPECT : REFERENCE_ASPECT;
  if (aspect >= reference) return p;
  const a = keys[segment].look;
  const b = keys[segment + 1].look;
  const weight = MathUtils.lerp(a.portrait, b.portrait, local);
  if (weight <= 0) return p;
  const fov = MathUtils.lerp(a.fov, b.fov, local);
  const halfWidth = Math.tan(MathUtils.degToRad(fov / 2)) * reference;
  const fitFov = Math.min(MathUtils.radToDeg(2 * Math.atan(halfWidth / aspect)), MAX_FIT_FOV);
  const pull = halfWidth / (Math.tan(MathUtils.degToRad(fitFov / 2)) * aspect);
  const aim = aims.getPoint(u);
  return p.sub(aim).multiplyScalar(MathUtils.lerp(1, pull, weight)).add(aim);
}

let failures = 0;
const segments = keys.length - 1;
console.log(`${tris.length.toLocaleString()} triangles, ${SAMPLES} samples per pass, clearance ${CLEARANCE} m`);
for (const [name, aspect] of [["16:9", REFERENCE_ASPECT], ["phone 390×844", PHONE_ASPECT]]) {
  console.log(`\n### ${name}\n\n| Move | Closest (m) | Nearest part | |\n|---|---|---|---|`);
  for (let s = 0; s < segments; s++) {
    let worst = { d: Infinity, label: "—" };
    const per = Math.ceil(SAMPLES / segments);
    for (let i = 0; i <= per; i++) {
      const r = nearest(cameraAt((s + i / per) / segments, s, i / per, aspect));
      if (r.d < worst.d) worst = r;
    }
    const ok = worst.d >= CLEARANCE;
    if (!ok) failures++;
    const move = `${keys[s].chapter}@${keys[s].at} → ${keys[s + 1].chapter}@${keys[s + 1].at}`;
    console.log(`| ${move} | ${worst.d === Infinity ? "> 0.25" : worst.d.toFixed(3)} | ${worst.label} | ${ok ? "✓" : "✗ clips"} |`);
  }
}
if (failures) {
  console.error(`\n${failures} move(s) come closer than ${CLEARANCE} m to the vehicle.`);
  process.exitCode = 1;
}
