/**
 * Texture preparation: Unreal-style PBR maps → glTF conventions.
 *
 * - RME (R roughness, G metallic, B emissive mask) is split into one PNG per
 *   channel for review, then repacked as glTF ORM (R occlusion, G roughness,
 *   B metallic).
 * - Normal maps are converted to OpenGL (+Y up) per texture, after detecting
 *   each file's convention (the source set mixes DirectX and OpenGL maps).
 * - Emissive is E × the RME emissive mask where the mask is used.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const file = (dir, name) => path.join(dir, `${name}.png`);

async function raw(input, channels = 3) {
  let img = sharp(input);
  const meta = await img.metadata();
  if (meta.channels < 3) img = img.toColourspace("srgb");
  img = channels === 4 ? img.ensureAlpha() : img.removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

const png = ({ data, width, height, channels }) =>
  sharp(data, { raw: { width, height, channels } }).png({ compressionLevel: 9 }).toBuffer();

async function resized(input, width, height, channels) {
  const meta = await sharp(input).metadata();
  if (meta.width === width && meta.height === height) return raw(input, channels);
  return raw(await sharp(input).resize(width, height, { fit: "fill" }).png().toBuffer(), channels);
}

/**
 * Detects a tangent-space normal map's green-channel convention.
 *
 * For a normal map derived from a height field, the mixed derivatives must
 * agree: ∂R/∂row and ∂G/∂x are negatively correlated for OpenGL (+Y up) and
 * positively for DirectX (+Y down). Flat or low-detail maps are "inconclusive" and are left as authored.
 */
export async function detectNormalConvention(input) {
  const { data, width: w, height: h, channels: c } = await raw(input);
  const px = (x, y, k) => (data[(y * w + x) * c + k] / 255) * 2 - 1;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const dRdy = px(x, y + 1, 0) - px(x, y - 1, 0);
      const dGdx = px(x + 1, y, 1) - px(x - 1, y, 1);
      sxy += dRdy * dGdx;
      sxx += dRdy * dRdy;
      syy += dGdx * dGdx;
    }
  }
  const correlation = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  const convention = Math.abs(correlation) < 0.1 ? "inconclusive" : correlation > 0 ? "directx" : "opengl";
  return { correlation, convention };
}

async function channelStats(img) {
  const { data, channels } = img;
  const max = [0, 0, 0];
  const sum = [0, 0, 0];
  const n = data.length / channels;
  for (let i = 0; i < data.length; i += channels) {
    for (let k = 0; k < 3; k++) {
      max[k] = Math.max(max[k], data[i + k]);
      sum[k] += data[i + k];
    }
  }
  return { max, mean: sum.map((s) => s / n) };
}

async function channelRange({ data, channels }) {
  const min = [255, 255, 255];
  const max = [0, 0, 0];
  for (let i = 0; i < data.length; i += channels) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], data[i + k]);
      max[k] = Math.max(max[k], data[i + k]);
    }
  }
  return { min, max };
}

/** Writes T_<set>_RME_{R,G,B}.png (greyscale) for review. */
async function splitRme(rmeFile, outDir) {
  const img = await raw(rmeFile);
  const base = path.basename(rmeFile, ".png");
  const files = {};
  for (const [k, ch] of ["R", "G", "B"].entries()) {
    const out = path.join(outDir, `${base}_${ch}.png`);
    await sharp(rmeFile).removeAlpha().extractChannel(k).png().toFile(out);
    files[ch] = out;
  }
  return { img, files, stats: await channelStats(img) };
}

/**
 * Builds the glTF texture images for one material spec.
 * Returns PNG buffers plus a report entry describing every decision.
 */
export async function prepareMaterialTextures(spec, { sourceDir, buildDir, maxSize, overrides = {} }) {
  const channelsDir = path.join(buildDir, "channels");
  const texturesDir = path.join(buildDir, "textures");
  await mkdir(channelsDir, { recursive: true });
  await mkdir(texturesDir, { recursive: true });

  const result = { images: {}, report: { material: spec.name, notes: [] } };
  const src = (suffix) => {
    if (!spec.set) return null;
    const name = `T_${spec.set}_${suffix}`;
    if (overrides[name]) return overrides[name];
    const f = file(sourceDir, name);
    return existsSync(f) ? f : null;
  };
  const save = async (name, buffer) => {
    let out = buffer;
    const meta = await sharp(buffer).metadata();
    if (meta.width > maxSize || meta.height > maxSize) {
      out = await sharp(buffer).resize(maxSize, maxSize, { fit: "inside" }).png().toBuffer();
      result.report.notes.push(`${name}: resized ${meta.width}→${maxSize}`);
    }
    await sharp(out).toFile(path.join(texturesDir, `${name}.png`));
    return { name, png: out };
  };

  // Base colour ---------------------------------------------------------------
  const baseFile = spec.base ? file(sourceDir, spec.base) : src("D");
  if (baseFile) {
    const keepAlpha = spec.alpha === "MASK" || spec.alpha === "BLEND";
    const img = await raw(baseFile, keepAlpha ? 4 : 3);
    result.images.baseColor = await save(`${path.basename(baseFile, ".png")}`, await png(img));
    result.report.baseColor = `${path.basename(baseFile)}${keepAlpha ? " (alpha kept)" : " (alpha dropped)"}`;
  }

  // Normal --------------------------------------------------------------------
  const normalFile = src("N");
  if (normalFile) {
    const { correlation, convention } = await detectNormalConvention(normalFile);
    const img = await raw(normalFile);
    const { min, max } = await channelRange(img);
    const flat = [0, 1].every((k) => max[k] - 128 <= 16 && 128 - min[k] <= 16);
    if (flat) {
      result.report.normal = `${path.basename(normalFile)} is flat (R/G within ±16 of 128): not shipped`;
    } else {
      const flip = convention === "directx";
      if (flip) for (let i = 1; i < img.data.length; i += img.channels) img.data[i] = 255 - img.data[i];
      result.images.normal = await save(`T_${spec.set}_N${flip ? "_GL" : ""}`, await png(img));
      result.images.normal.flippedY = flip;
      result.report.normal = `${path.basename(normalFile)} ${convention} (r=${correlation.toFixed(2)})${flip ? " → green flipped" : ""}`;
    }
  }

  // RME → ORM -----------------------------------------------------------------
  const rmeFile = src("RME");
  let rme = null;
  if (rmeFile) {
    rme = await splitRme(rmeFile, channelsDir);
    const aoFile = src("AO");
    const range = await channelRange(rme.img);
    if (!aoFile && [0, 1].every((k) => range.max[k] - range.min[k] <= 8)) {
      // Uniform roughness/metallic: material factors instead of a texture.
      const [roughness, metallic] = rme.stats.mean.map((m) => m / 255);
      result.ormFactors = { roughness, metallic };
      result.report.orm = `RME uniform → factors roughness ${roughness.toFixed(2)}, metallic ${metallic.toFixed(2)}`;
      result.report.rmeChannels = rme.files;
      result.report.rmeStats = rme.stats;
    }
  }
  if (rmeFile && !result.ormFactors) {
    const { width, height } = rme.img;
    const aoFile = src("AO");
    const ao = aoFile ? await resized(aoFile, width, height, 3) : null;
    const orm = Buffer.alloc(width * height * 3);
    for (let p = 0, s = 0; p < width * height; p++, s += rme.img.channels) {
      orm[p * 3] = ao ? ao.data[p * ao.channels] : 255;
      orm[p * 3 + 1] = rme.img.data[s]; // roughness ← RME.R
      orm[p * 3 + 2] = rme.img.data[s + 1]; // metallic ← RME.G
    }
    result.images.orm = await save(`T_${spec.set}_ORM`, await png({ data: orm, width, height, channels: 3 }));
    const [r, g, b] = rme.stats.mean.map((m) => (m / 255).toFixed(2));
    result.report.orm = `R=${aoFile ? path.basename(aoFile) + ".R" : "1"} G=RME.R (μ${r}) B=RME.G (μ${g}); RME.B μ${b}`;
    result.report.rmeChannels = rme.files;
    result.report.rmeStats = rme.stats;
  }

  // Emissive ------------------------------------------------------------------
  const emissiveFile = spec.emissive === false ? null : src("E");
  if (emissiveFile) {
    const e = await raw(emissiveFile);
    const eStats = await channelStats(e);
    if (Math.max(...eStats.max) === 0) {
      result.report.notes.push(`${path.basename(emissiveFile)} is black: skipped`);
    } else if (rme && rme.stats.max[2] > 0) {
      const mask = await resized(rmeFile, e.width, e.height, 3);
      for (let p = 0; p < e.width * e.height; p++) {
        const m = mask.data[p * 3 + 2] / 255;
        for (let k = 0; k < 3; k++) e.data[p * 3 + k] = Math.round(e.data[p * 3 + k] * m);
      }
      result.images.emissive = await save(`T_${spec.set}_EM`, await png(e));
      result.images.emissive.factor = spec.emissiveFactor ?? 1;
      result.report.emissive = `${path.basename(emissiveFile)} × RME.B mask, factor ${result.images.emissive.factor}`;
    } else {
      result.images.emissive = await save(`T_${spec.set}_E`, await png(e));
      result.images.emissive.factor = spec.emissiveFactor ?? 0;
      result.report.emissive = `${path.basename(emissiveFile)} unmasked (RME.B = 0), factor ${result.images.emissive.factor} (off by default)`;
    }
  }

  return result;
}
