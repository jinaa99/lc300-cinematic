/**
 * Loads a binary FBX with three.js' FBXLoader in Node.
 *
 * FBXLoader normally decodes textures through the DOM. In Node the texture
 * loader is stubbed so each texture only records its URL. Embedded textures
 * arrive as blob: URLs; they are matched back to the source PNGs by content
 * hash so reports can name the real file.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Texture, TextureLoader } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

TextureLoader.prototype.load = function load(url) {
  const texture = new Texture();
  texture.userData.url = String(url);
  return texture;
};

const sha1 = (buffer) => createHash("sha1").update(buffer).digest("hex");

export async function loadFbx(file, textureDir = path.dirname(file)) {
  const blobs = new Map();
  const createObjectURL = URL.createObjectURL;
  URL.createObjectURL = (blob) => {
    const url = createObjectURL(blob);
    blobs.set(url, blob);
    return url;
  };

  const buffer = await readFile(file);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const warnings = [];
  const warn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));
  let root;
  try {
    root = new FBXLoader().parse(arrayBuffer, path.dirname(file) + "/");
  } finally {
    console.warn = warn;
    URL.createObjectURL = createObjectURL;
  }

  const byHash = new Map();
  for (const f of await readdir(textureDir)) {
    if (f.endsWith(".png")) byHash.set(sha1(await readFile(path.join(textureDir, f))), f);
  }
  const urlToFile = new Map();
  for (const [url, blob] of blobs) {
    const hash = sha1(Buffer.from(await blob.arrayBuffer()));
    urlToFile.set(url, byHash.get(hash) ?? `(embedded, ${blob.size} B, no matching source file)`);
  }

  /** Source file name for a texture FBXLoader created. */
  const textureFile = (texture) => {
    const url = texture.userData.url ?? "";
    return urlToFile.get(url) ?? path.basename(decodeURIComponent(url));
  };

  root.updateMatrixWorld(true);
  return { root, warnings, textureFile };
}

/** Texture slots FBXLoader may set on a MeshPhongMaterial. */
export const phongSlots = ["map", "normalMap", "bumpMap", "specularMap", "emissiveMap", "alphaMap", "aoMap"];

/** Parses `TSK_<Part>_101_…` / `TSM_<Part>_101_…` into `<Part>`. */
export function sourcePart(name) {
  return /^T?S[KM]_(.+?)_101/.exec(name)?.[1] ?? null;
}
