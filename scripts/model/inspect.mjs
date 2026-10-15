/**
 * npm run model:inspect [-- --glb [file]]
 *
 * Default: inspects the source FBX and prints, as Markdown tables, every mesh,
 * material and texture with how the pipeline maps it (FBX → glTF).
 * --glb: inspects the built GLB instead (nodes, materials, KTX2 textures).
 *
 * The report is also written to assets-src/lc300/build/report/.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";
import { excludedTextures, materials as materialSpecs, paths } from "./config.mjs";
import { convert } from "./convert.mjs";
import { loadFbx, phongSlots, sourcePart } from "./fbx.mjs";
import { primitiveTriangles, sceneStats } from "./stats.mjs";
import { detectNormalConvention } from "./textures.mjs";

const lines = [];
const out = (s = "") => lines.push(s);
const table = (head, rows) => {
  out(`| ${head.join(" | ")} |`);
  out(`|${head.map(() => "---").join("|")}|`);
  for (const r of rows) out(`| ${r.map((c) => String(c ?? "").replaceAll("|", "\\|")).join(" | ")} |`);
  out();
};
const n = (x) => Math.round(x).toLocaleString("en-US");

const args = process.argv.slice(2);
const glbIndex = args.indexOf("--glb");

if (glbIndex === -1 && !existsSync(paths.fbx)) {
  console.error(`Source FBX not found at ${paths.fbx}. See docs/ASSETS.md.`);
  process.exit(1);
}
if (glbIndex === -1) await inspectFbx();
else await inspectGlb(args[glbIndex + 1] ?? paths.out);

const reportName = glbIndex === -1 ? "inspect-fbx.md" : "inspect-glb.md";
await mkdir(path.join(paths.build, "report"), { recursive: true });
await writeFile(path.join(paths.build, "report", reportName), lines.join("\n"));
console.log(lines.join("\n"));

async function inspectFbx() {
  const { root, warnings, textureFile } = await loadFbx(paths.fbx, paths.textures);
  // Run the converter (without textures) only to learn where each mesh lands.
  const { report } = convert(root, { textures: new Map() });
  const placed = new Map(report.meshes.map((m) => [`${m.source}|${m.material}`, m.node]));
  for (const b of report.badges) placed.set(b.source, b.name);

  out(`# FBX inspection — ${path.basename(paths.fbx)}`);
  out();
  out(`Bounds: ${report.bounds.size.map((v) => v.toFixed(3)).join(" × ")} m (X width × Y height × Z length).`);
  out(`FBXLoader warnings: ${warnings.length}.`);
  out();

  // Meshes ---------------------------------------------------------------------
  out("## Meshes");
  out();
  const meshRows = [];
  const materialUse = new Map();
  let total = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const count = (g.index ? g.index.count : g.attributes.position.count) / 3;
    total += count;
    const mats = [o.material].flat();
    for (const m of mats) {
      const e = materialUse.get(m.name) ?? { material: m, meshes: 0, triangles: 0 };
      e.meshes++;
      e.triangles += count / mats.length;
      materialUse.set(m.name, e);
    }
    const node = placed.get(o.name) ?? placed.get(`${o.name}|${mats[0].name}`) ?? "?";
    meshRows.push([
      meshRows.length + 1,
      o.name,
      sourcePart(o.name) ?? o.parent?.name ?? "",
      node,
      mats.map((m) => `${m.name} → ${materialSpecs[m.name]?.name ?? "?"}`).join(", "),
      n(count),
    ]);
  });
  table(["#", "FBX mesh", "Part", "glTF node", "Material (FBX → glTF)", "Triangles"], meshRows);
  out(`Total: ${meshRows.length} meshes, ${n(total)} triangles.`);
  out();

  // Materials --------------------------------------------------------------------
  out("## Materials");
  out();
  const files = new Set((await readdir(paths.textures)).filter((f) => f.endsWith(".png")));
  const bound = new Map(); // texture file → [material names]
  const materialRows = [];
  for (const [name, { material, meshes, triangles }] of materialUse) {
    const spec = materialSpecs[name] ?? {};
    const linked = phongSlots
      .filter((s) => material[s])
      .map((s) => `${s}: ${textureFile(material[s])}`)
      .join("<br>");
    const bySet = spec.base
      ? [`${spec.base}.png`]
      : spec.set
        ? ["D", "N", "RME", "E", "AO"].map((s) => `T_${spec.set}_${s}.png`).filter((f) => files.has(f))
        : [];
    for (const f of bySet) bound.set(f, [...(bound.get(f) ?? []), spec.name]);
    materialRows.push([
      name,
      spec.name ?? "?",
      meshes,
      n(triangles),
      linked || "—",
      bySet.join(", ") || `factors only (${(spec.color ?? []).join(", ")})`,
      spec.alpha ?? "OPAQUE",
    ]);
  }
  table(
    ["FBX material", "glTF material", "Meshes", "Triangles", "Linked in FBX", "Bound by convention", "Alpha"],
    materialRows,
  );

  // Textures ---------------------------------------------------------------------
  out("## Source textures");
  out();
  // Per-file decisions from the last build, when there is one.
  const buildReport = path.join(paths.build, "report/build.json");
  const decisions = new Map();
  if (existsSync(buildReport)) {
    for (const t of JSON.parse(await readFile(buildReport, "utf8")).textures) {
      for (const [slot, text] of Object.entries(t)) {
        if (typeof text !== "string" || slot === "source" || slot === "material") continue;
        const f = /T_\w+?\.png/.exec(text)?.[0];
        if (f && !decisions.get(f)?.includes(text)) decisions.set(f, [...(decisions.get(f) ?? []), `${t.material}: ${text}`]);
      }
      for (const note of t.notes) {
        const f = /T_\w+?\.png/.exec(note)?.[0];
        if (f) decisions.set(f, [...(decisions.get(f) ?? []), `${t.material}: ${note}`]);
      }
    }
  }
  const textureRows = [];
  for (const f of [...files].sort()) {
    const base = f.replace(/\.png$/, "");
    const meta = await sharp(path.join(paths.textures, f)).metadata();
    const suffix = base.split("_").at(-1);
    const role =
      { D: "base colour", N: "normal", RME: "rough/metal/emissive-mask", E: "emissive", AO: "occlusion" }[suffix] ?? "";
    let convention = "";
    if (suffix === "N") {
      const { correlation, convention: c } = await detectNormalConvention(path.join(paths.textures, f));
      convention = `${c} (r=${correlation.toFixed(2)})`;
    }
    const decision = excludedTextures[base]
      ? `not shipped: ${excludedTextures[base]}`
      : decisions.has(f)
        ? decisions.get(f).join("<br>")
        : bound.has(f)
          ? `→ ${[...new Set(bound.get(f))].join(", ")}`
          : "unused";
    textureRows.push([f, `${meta.width}×${meta.height}`, meta.channels, role, convention, decision]);
  }
  table(["File", "Size", "Ch", "Role", "Normal convention", "Pipeline"], textureRows);

  // Wheels -----------------------------------------------------------------------
  out("## Wheels");
  out();
  table(
    ["Wheel", "Hub (m, origin-relative)", "Ø / width (m)", "Axle = X", "FBX pivot vs geometry centre", "Spins", "Caliper (static)"],
    report.wheels.map((w) => [
      `wheel_${w.id}`,
      w.hub.map((v) => v.toFixed(3)).join(", "),
      `${w.diameter.toFixed(3)} / ${w.width.toFixed(3)}`,
      w.axleIsX ? "yes" : "NO",
      `${(w.sourcePivotError * 1000).toFixed(1)} mm`,
      w.spinning.join("<br>"),
      w.calipers.join("<br>") || "—",
    ]),
  );
}

async function inspectGlb(file) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  await MeshoptDecoder.ready;
  const doc = await io.read(file);
  const root = doc.getRoot();
  const stats = sceneStats(doc);
  const bytes = (await stat(file)).size;

  out(`# GLB inspection — ${path.relative(process.cwd(), file)}`);
  out();
  table(
    ["File size", "Triangles", "Draw calls", "Materials", "Textures", "Nodes", "Extensions"],
    [[
      `${(bytes / 1024 / 1024).toFixed(2)} MB`,
      n(stats.triangles),
      stats.drawCalls,
      stats.materials,
      stats.textures,
      stats.nodes,
      root.listExtensionsUsed().map((e) => e.extensionName).join(", "),
    ]],
  );

  out("## Nodes");
  out();
  const rows = [];
  for (const scene of root.listScenes()) {
    const walk = (node, depth) => {
      const mesh = node.getMesh();
      const prims = mesh?.listPrimitives() ?? [];
      const t = node.getTranslation();
      rows.push([
        `${"  ".repeat(depth)}${node.getName()}`,
        t.some((v) => v !== 0) ? t.map((v) => v.toFixed(3)).join(", ") : "",
        prims.length || "",
        prims.length ? n(prims.reduce((s, p) => s + primitiveTriangles(p), 0)) : "",
        prims.map((p) => p.getMaterial()?.getName()).join(", "),
        Object.keys(node.getExtras()).length ? JSON.stringify(node.getExtras()) : "",
      ]);
      for (const c of node.listChildren()) walk(c, depth + 1);
    };
    for (const c of scene.listChildren()) walk(c, 0);
  }
  table(["Node", "Translation", "Draw calls", "Triangles", "Materials", "Extras"], rows.map((r) => [r[0].replaceAll(" ", "&nbsp;"), ...r.slice(1)]));

  out("## Materials");
  out();
  table(
    ["Material", "Alpha", "Base colour", "Normal", "ORM", "Emissive", "Rough / metal factors", "Extras"],
    root.listMaterials().map((m) => [
      m.getName(),
      m.getAlphaMode() + (m.getDoubleSided() ? ", double-sided" : ""),
      m.getBaseColorTexture()?.getName() ?? m.getBaseColorFactor().map((v) => v.toFixed(2)).join(", "),
      m.getNormalTexture()?.getName() ?? "—",
      m.getMetallicRoughnessTexture()?.getName() ?? "—",
      m.getEmissiveTexture() ? `${m.getEmissiveTexture().getName()} ×${m.getEmissiveFactor()[0]}` : "—",
      `${m.getRoughnessFactor().toFixed(2)} / ${m.getMetallicFactor().toFixed(2)}`,
      JSON.stringify(m.getExtras()),
    ]),
  );

  out("## Textures");
  out();
  table(
    ["Texture", "Format", "Size", "Bytes"],
    root.listTextures().map((t) => [t.getName(), t.getMimeType(), (t.getSize() ?? []).join("×"), n(t.getImage().byteLength)]),
  );
}
