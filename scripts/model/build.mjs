/**
 * npm run model:build
 *
 * FBX (assets-src/lc300/source) → public/models/lc300.glb
 *
 *   1. Load the FBX (three.js FBXLoader, in Node).
 *   2. Prepare textures: RME → ORM, normal maps → OpenGL, emissive masks.
 *   3. Convert to glTF: +Y up, metres, bottom-centre origin, named parts,
 *      wheel hubs pivoted at the wheel centre, badges as separate nodes.
 *   4. Optimise: dedup, prune, weld, join (per mesh), Meshopt, KTX2.
 *   5. Report size, triangles, draw calls and materials against the budget.
 *
 * Intermediate files go to assets-src/lc300/build/ (git-ignored):
 *   channels/  RME channels as separate greyscale PNGs
 *   textures/  repacked PNGs fed to the KTX2 encoder
 *   lc300.raw.glb  unoptimised conversion (PNG textures), for debugging
 *   report/build.json
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, join, meshopt, prune, weld } from "@gltf-transform/functions";
import { ktx2 } from "ktx2-encoder/gltf-transform";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import { budget, materials as materialSpecs, paths, textureEdits } from "./config.mjs";
import { applyTextureEdits } from "./edits.mjs";
import { convert } from "./convert.mjs";
import { loadFbx } from "./fbx.mjs";
import { prepareMaterialTextures } from "./textures.mjs";
import { sceneStats } from "./stats.mjs";

const t0 = performance.now();
const log = (...args) => console.log(`[${((performance.now() - t0) / 1000).toFixed(1)}s]`, ...args);

await mkdir(path.join(paths.build, "report"), { recursive: true });
await mkdir(path.dirname(paths.out), { recursive: true });

// 1. Load ----------------------------------------------------------------------
log("Loading", path.relative(process.cwd(), paths.fbx));
const { root, warnings } = await loadFbx(paths.fbx, paths.textures);
if (warnings.length) log(`FBXLoader warnings: ${warnings.length}`);

// 2. Textures --------------------------------------------------------------------
const edits = await applyTextureEdits(textureEdits, { sourceDir: paths.textures, buildDir: paths.build });
for (const line of edits.report) log("Edit", line);
const used = new Set();
root.traverse((o) => o.isMesh && [o.material].flat().forEach((m) => used.add(m.name)));
const textures = new Map();
const textureReport = [];
for (const name of used) {
  const spec = materialSpecs[name];
  if (!spec) throw new Error(`No material mapping for FBX material "${name}" in config.mjs`);
  const prepared = await prepareMaterialTextures(spec, {
    sourceDir: paths.textures,
    buildDir: paths.build,
    maxSize: budget.maxTextureSize,
    overrides: edits.files,
  });
  textures.set(name, prepared);
  textureReport.push({ source: name, ...prepared.report });
}
log(`Prepared textures for ${textures.size} materials`);

// 3. Convert ---------------------------------------------------------------------
const { doc, report } = convert(root, { textures });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder,
  "meshopt.decoder": MeshoptDecoder,
});
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const rawPath = path.join(paths.build, "lc300.raw.glb");
await io.write(rawPath, doc);
const rawStats = sceneStats(doc);
log(`Converted: ${rawStats.triangles.toLocaleString()} triangles, ${rawStats.drawCalls} draw calls`);

// 4. Optimise --------------------------------------------------------------------
await doc.transform(dedup(), prune(), weld(), join({ keepMeshes: true }));
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
log("Geometry optimised (dedup, prune, weld, join, meshopt)");

const imageDecoder = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data) };
};
const common = { imageDecoder, generateMipmap: true, isKTX2File: true };
// The Basis encoder (WASM) prints per-slice progress to stdout; keep the log readable.
const write = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) =>
  /^(Slice|Mode|Total slices|basis_compressor|Using|Processing|Source image|Total basis|Encoding)/.test(String(chunk)) ? true : write(chunk, ...rest);
await doc.transform(
  // Normal maps: UASTC, linear.
  ktx2({
    ...common,
    slots: /^normalTexture$/,
    isUASTC: true,
    isNormalMap: true,
    isPerceptual: false,
    isSetKTX2SRGBTransferFunc: false,
    uastcLDRQualityLevel: 2,
    needSupercompression: true,
  }),
  // Colour data: ETC1S, sRGB.
  ktx2({
    ...common,
    slots: /^(baseColorTexture|emissiveTexture)$/,
    isUASTC: false,
    isPerceptual: true,
    isSetKTX2SRGBTransferFunc: true,
    qualityLevel: 230,
    compressionLevel: 2,
  }),
  // Non-colour data (ORM): ETC1S, linear.
  ktx2({
    ...common,
    slots: /^(metallicRoughnessTexture|occlusionTexture)$/,
    isUASTC: false,
    isPerceptual: false,
    isSetKTX2SRGBTransferFunc: false,
    qualityLevel: 230,
    compressionLevel: 2,
  }),
);
process.stdout.write = write;
for (const texture of doc.getRoot().listTextures()) {
  if (texture.getMimeType() !== "image/ktx2") throw new Error(`Texture ${texture.getName()} was not converted to KTX2`);
  texture.setURI("");
}
log("Textures encoded to KTX2");

// 5. Write + report ------------------------------------------------------------
await io.write(paths.out, doc);
const bytes = (await stat(paths.out)).size;
const stats = sceneStats(doc);

const checks = [
  ["File size", `${(bytes / 1024 / 1024).toFixed(2)} MB`, `≤ ${budget.bytes / 1024 / 1024} MB`, bytes <= budget.bytes],
  ["Triangles", stats.triangles.toLocaleString(), `≤ ${budget.triangles.toLocaleString()}`, stats.triangles <= budget.triangles],
  ["Largest texture", `${stats.maxTextureSize}px`, `≤ ${budget.maxTextureSize}px`, stats.maxTextureSize <= budget.maxTextureSize],
  ["Draw calls", String(stats.drawCalls), "-", true],
  ["Materials", String(stats.materials), "-", true],
  ["Textures", `${stats.textures} (KTX2)`, "-", true],
  ["Nodes", String(stats.nodes), "-", true],
];

await writeFile(
  path.join(paths.build, "report/build.json"),
  JSON.stringify({ bytes, stats, rawStats, edits: edits.report, textures: textureReport, ...report }, null, 2),
);

await rmeSheet(textureReport, path.join(paths.build, "report/rme-channels.png"));

console.log("\nOutput:", path.relative(process.cwd(), paths.out));
console.log("| Metric | Value | Budget | |\n|---|---|---|---|");
for (const [k, v, b, ok] of checks) console.log(`| ${k} | ${v} | ${b} | ${ok ? "✓" : "✗ over"} |`);
if (!checks.every(([, , , ok]) => ok)) process.exitCode = 1;

/** Review sheet: each RME texture next to its R, G and B channels, with the reading applied. */
async function rmeSheet(entries, out) {
  const T = 200;
  const L = 40;
  const seen = new Set();
  const rows = entries.filter((e) => e.rmeChannels && !seen.has(e.rmeChannels.R) && seen.add(e.rmeChannels.R));
  const label = (lines) =>
    Buffer.from(
      `<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#0a0a0c"/>${lines
        .map((t, i) => `<text x="8" y="${16 + i * 16}" font-family="Helvetica" font-size="13" fill="#e8e8e6">${t}</text>`)
        .join("")}</svg>`,
    );
  const tiles = [];
  for (const [r, e] of rows.entries()) {
    const set = path.basename(e.rmeChannels.R).replace(/_RME_R\.png$/, "");
    const { mean, max } = e.rmeStats;
    const cells = [
      [path.join(paths.textures, `${set}_RME.png`), [`${set}_RME`, `(used by ${e.material})`]],
      [e.rmeChannels.R, ["R → roughness", `mean ${(mean[0] / 255).toFixed(2)}`]],
      [e.rmeChannels.G, ["G → metallic", `mean ${(mean[1] / 255).toFixed(2)}`]],
      [e.rmeChannels.B, ["B → emissive mask", max[2] ? `mean ${(mean[2] / 255).toFixed(2)}` : "all 0 (unused)"]],
    ];
    for (const [c, [file, text]] of cells.entries()) {
      tiles.push({ input: label(text), left: c * T, top: r * (T + L) });
      tiles.push({ input: await sharp(file).removeAlpha().resize(T, T, { fit: "fill" }).png().toBuffer(), left: c * T, top: r * (T + L) + L });
    }
  }
  await sharp({ create: { width: 4 * T, height: rows.length * (T + L), channels: 3, background: "#000" } })
    .composite(tiles)
    .png()
    .toFile(out);
}
