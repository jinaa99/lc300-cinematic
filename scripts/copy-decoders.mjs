/**
 * Copies runtime data files from installed packages into public/, so they
 * are served locally (no CDN) and always match the installed versions:
 *   public/basis/       KTX2 (Basis Universal) transcoder from three
 *   public/detect-gpu/  GPU benchmark tables from detect-gpu
 * Runs on `npm install` (postinstall); the output is git-ignored.
 */
import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function copy(fromDir, toDir, filter = () => true) {
  const from = path.join(root, fromDir);
  const to = path.join(root, toDir);
  await mkdir(to, { recursive: true });
  for (const file of (await readdir(from)).filter(filter)) await cp(path.join(from, file), path.join(to, file));
}

await copy("node_modules/three/examples/jsm/libs/basis", "public/basis", (f) => /^basis_transcoder\.(js|wasm)$/.test(f));
await copy("node_modules/detect-gpu/dist/benchmarks", "public/detect-gpu", (f) => f.endsWith(".json"));
