/**
 * npm run model:render [-- --glb file]
 *
 * Renders review images of the built GLB in headless Chrome with three.js
 * (the same Meshopt + KTX2 decoding path the site will use):
 *
 *   views-*.png          3/4 front, side and rear 3/4 under neutral studio light
 *   normals-quads.png    every shipped normal map on a flat plane, as authored vs
 *                        green-flipped, under one grazing light from the upper left
 *   normals-model.png    close-ups on the model: maps as authored / pipeline /
 *                        blanket flip, same camera and light
 *
 * Output: assets-src/lc300/build/report/renders/
 * Needs Google Chrome (or set CHROME_PATH).
 */
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { paths, ROOT } from "./config.mjs";

const args = process.argv.slice(2);
const glbFile = path.resolve(args.includes("--glb") ? args[args.indexOf("--glb") + 1] : paths.out);
const outDir = path.join(paths.build, "report/renders");
await mkdir(outDir, { recursive: true });

const chromePath =
  process.env.CHROME_PATH ??
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(
    existsSync,
  );
if (!chromePath) throw new Error("Chrome not found. Set CHROME_PATH.");

// Static server ------------------------------------------------------------------
const routes = [
  ["/three/", path.join(ROOT, "node_modules/three/")],
  ["/textures/", path.join(paths.build, "textures/")],
  ["/source/", paths.textures + "/"],
];
const types = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".png": "image/png", ".glb": "model/gltf-binary" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = null;
  if (url === "/") file = path.join(ROOT, "scripts/model/render/viewer.html");
  else if (url === "/model.glb") file = glbFile;
  else {
    const route = routes.find(([prefix]) => url.startsWith(prefix));
    const candidate = route && path.join(route[1], url.slice(route[0].length));
    if (candidate?.startsWith(route[1])) file = candidate;
  }
  if (!file || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu"],
});

try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(base);
  await page.waitForFunction(() => window.ready === true);
  const info = await page.evaluate(() => window.api.load("/model.glb"));
  console.log(`Loaded ${path.relative(process.cwd(), glbFile)}: ${info.meshes} meshes on ${info.renderer}`);

  const decode = (dataUrl) => Buffer.from(dataUrl.split(",")[1], "base64");
  const label = (text, width, height = 34, size = 17) =>
    Buffer.from(
      `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#0a0a0c"/><text x="12" y="${height / 2 + size / 3}" font-family="Helvetica" font-size="${size}" fill="#e8e8e6">${text}</text></svg>`,
    );
  const grid = async (cells, cols, cellW, cellH, out) => {
    const rows = Math.ceil(cells.length / cols);
    const L = 34;
    await sharp({ create: { width: cols * cellW, height: rows * (cellH + L), channels: 3, background: "#000" } })
      .composite(
        cells.flatMap((c, i) => [
          { input: label(c.label, cellW), left: (i % cols) * cellW, top: Math.floor(i / cols) * (cellH + L) },
          { input: c.image, left: (i % cols) * cellW, top: Math.floor(i / cols) * (cellH + L) + L },
        ]),
      )
      .png()
      .toFile(out);
  };

  // 1. Static views ----------------------------------------------------------------
  const views = {
    "three-quarter-front": { position: [4.3, 1.35, 5.7], target: [0, 0.85, 0.15] },
    side: { position: [9.2, 1.05, 0.0], target: [0, 0.9, 0.0] },
    "three-quarter-rear": { position: [-4.3, 1.6, -5.7], target: [0, 0.85, -0.15] },
  };
  const viewStats = {};
  for (const [name, view] of Object.entries(views)) {
    const r = await page.evaluate((v) => window.api.view(v), view);
    await writeFile(path.join(outDir, `view-${name}.png`), decode(r.image));
    viewStats[name] = { drawCalls: r.drawCalls, triangles: r.triangles };
  }
  console.log("Views:", JSON.stringify(viewStats));

  // 2. Normal maps on flat quads ---------------------------------------------------
  const normalMaps = ["Tyre", "Logo", "Grid_A", "Cabin", "Light", "Engine", "Rim", "Brake", "Suspension"];
  const cells = [];
  for (const flipGreen of [false, true]) {
    const image = await page.evaluate((o) => window.api.normalQuad(o), { url: "reference", flipGreen, size: 300 });
    cells.push({ label: `REFERENCE raised dome (OpenGL) · ${flipGreen ? "flipped = WRONG" : "correct"}`, image: decode(image) });
  }
  for (const set of normalMaps) {
    for (const flipGreen of [false, true]) {
      const image = await page.evaluate((o) => window.api.normalQuad(o), {
        url: `/source/T_${set}_N.png`,
        flipGreen,
        size: 300,
      });
      cells.push({ label: `T_${set}_N · ${flipGreen ? "green flipped" : "as authored"}`, image: decode(image) });
    }
  }
  await grid(cells, 4, 300, 300, path.join(outDir, "normals-quads.png"));

  // 3. Normal maps on the model -------------------------------------------------------
  const closeUps = {
    "tyre sidewall (DirectX map)": { position: [1.75, 0.3, 2.05], target: [0.96, 0.22, 1.62], fov: 22, grazing: true },
    "rim centre (OpenGL map)": { position: [1.55, 0.47, 1.62], target: [0.95, 0.41, 1.56], fov: 20, grazing: true },
    "rear badge (DirectX map)": { position: [0.45, 1.2, -3.1], target: [0.08, 1.1, -2.4], fov: 18, grazing: true },
  };
  const modelCells = [];
  for (const [name, view] of Object.entries(closeUps)) {
    for (const normals of ["source", "pipeline", "flip-all"]) {
      const r = await page.evaluate((v) => window.api.view(v), { ...view, normals, width: 520, height: 390 });
      const caption = { source: "as authored", pipeline: "pipeline (per-texture)", "flip-all": "blanket green flip" }[normals];
      modelCells.push({ label: `${name} · ${caption}`, image: decode(r.image) });
    }
  }
  await grid(modelCells, 3, 520, 390, path.join(outDir, "normals-model.png"));

  // 4. Badges on / off (siteConfig.showBadges) --------------------------------------
  const badgeViews = {
    front: { position: [1.1, 1.05, 4.6], target: [0, 0.9, 2.4], fov: 26 },
    rear: { position: [-1.2, 1.25, -4.7], target: [0, 1.12, -2.4], fov: 30 },
    wheel: { position: [1.85, 0.45, 1.6], target: [0.95, 0.41, 1.56], fov: 26 },
  };
  const badgeCells = [];
  for (const [name, view] of Object.entries(badgeViews)) {
    for (const badges of [true, false]) {
      const r = await page.evaluate((v) => window.api.view(v), { ...view, badges, width: 520, height: 390 });
      badgeCells.push({ label: `${name} · showBadges = ${badges}`, image: decode(r.image) });
    }
  }
  await grid(badgeCells, 2, 520, 390, path.join(outDir, "badges.png"));

  console.log("Renders written to", path.relative(process.cwd(), outDir));
} finally {
  await browser.close();
  server.close();
}
