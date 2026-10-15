/**
 * three.js scene (from FBXLoader) → glTF-Transform Document.
 *
 * Output conventions (glTF / three.js):
 *   +Y up, metres, vehicle front towards +Z, driver's left towards +X,
 *   origin at the bottom centre of the vehicle's bounding box (ground plane).
 *
 * Scene graph:
 *   lc300
 *     <part>                 static body parts, one mesh each (body, hood, door_FL, lamp_front, …)
 *       badge_<where>        badge meshes, toggled by extras.badge
 *     wheels
 *       hub_<FL|FR|RL|RR>    at the wheel centre; steer/suspension pivot (does not spin)
 *         wheel_<id>         spins about local X: tyre, rim, brake disc
 *           badge_wheel_<id>
 *         caliper_<id>       brake caliper: follows steering, never spins
 */
import { Document } from "@gltf-transform/core";
import { Box3, Matrix3, Vector3 } from "three";
import { badgeIslands, caliperOffset, materials as materialSpecs, parts, wheelBadgeMaterial } from "./config.mjs";
import { sourcePart } from "./fbx.mjs";

function geometryBox(mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
}

/**
 * Splits a (single-material) mesh into connected islands. Vertices are
 * matched by position, since FBXLoader output is not indexed.
 * Returns each island's triangle indices and world-space bounding box.
 */
function islands(mesh) {
  const pos = mesh.geometry.attributes.position;
  const index = mesh.geometry.index?.array;
  const corners = index ? index.length : pos.count;
  const vertexAt = (i) => (index ? index[i] : i);
  const ids = new Map();
  const corner = new Int32Array(corners);
  for (let i = 0; i < corners; i++) {
    const k = vertexAt(i);
    const key = `${pos.getX(k).toFixed(5)},${pos.getY(k).toFixed(5)},${pos.getZ(k).toFixed(5)}`;
    if (!ids.has(key)) ids.set(key, ids.size);
    corner[i] = ids.get(key);
  }
  const parent = Int32Array.from({ length: ids.size }, (_, i) => i);
  const find = (a) => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  for (let t = 0; t < corners / 3; t++) {
    const a = find(corner[t * 3]);
    parent[find(corner[t * 3 + 1])] = a;
    parent[find(corner[t * 3 + 2])] = a;
  }
  const result = new Map();
  const v = new Vector3();
  for (let t = 0; t < corners / 3; t++) {
    const root = find(corner[t * 3]);
    if (!result.has(root)) result.set(root, { triangles: [], box: new Box3() });
    const island = result.get(root);
    island.triangles.push(t);
    for (let j = 0; j < 3; j++) island.box.expandByPoint(v.fromBufferAttribute(pos, vertexAt(t * 3 + j)).applyMatrix4(mesh.matrixWorld));
  }
  return [...result.values()];
}

/** Material assignment per draw group of a three.js mesh. */
function drawGroups(mesh) {
  const g = mesh.geometry;
  const count = g.index ? g.index.count : g.attributes.position.count;
  const mats = [mesh.material].flat();
  const groups = g.groups.length ? g.groups : [{ start: 0, count, materialIndex: 0 }];
  return groups.map((group) => ({ ...group, material: mats[group.materialIndex ?? 0] }));
}

export function convert(root, { textures }) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const report = { parts: [], wheels: [], badges: [], meshes: [] };

  // Origin: bottom centre of everything ---------------------------------------
  const bounds = new Box3().setFromObject(root);
  const origin = new Vector3((bounds.min.x + bounds.max.x) / 2, bounds.min.y, (bounds.min.z + bounds.max.z) / 2);
  const size = bounds.getSize(new Vector3());
  report.bounds = { size: size.toArray(), origin: origin.toArray() };

  // Materials ------------------------------------------------------------------
  const textureCache = new Map();
  const texture = (image, mimeType = "image/png") => {
    if (!textureCache.has(image.name)) {
      textureCache.set(
        image.name,
        doc.createTexture(image.name).setImage(image.png).setMimeType(mimeType).setURI(`${image.name}.png`),
      );
    }
    return textureCache.get(image.name);
  };
  const materialCache = new Map();
  const materialFor = (fbxMaterial) => {
    const key = fbxMaterial.name;
    if (materialCache.has(key)) return materialCache.get(key);
    const spec = materialSpecs[key];
    if (!spec) throw new Error(`No material mapping for FBX material "${key}" in scripts/model/config.mjs`);
    const prepared = textures.get(key);
    const m = doc.createMaterial(spec.name);
    m.setBaseColorFactor(spec.color ?? [1, 1, 1, 1]);
    const factors = prepared?.images.orm ? { roughness: 1, metallic: 1 } : prepared?.ormFactors;
    m.setRoughnessFactor(factors?.roughness ?? spec.roughness ?? 0.5);
    m.setMetallicFactor(factors?.metallic ?? spec.metallic ?? 0);
    m.setAlphaMode(spec.alpha ?? "OPAQUE");
    if (spec.alpha === "MASK") m.setAlphaCutoff(0.5);
    m.setDoubleSided(Boolean(spec.doubleSided));
    const images = prepared?.images ?? {};
    if (images.baseColor) m.setBaseColorTexture(texture(images.baseColor));
    if (images.normal) m.setNormalTexture(texture(images.normal));
    if (images.orm) {
      const orm = texture(images.orm);
      m.setMetallicRoughnessTexture(orm);
      m.setOcclusionTexture(orm);
    }
    if (images.emissive) {
      m.setEmissiveTexture(texture(images.emissive));
      m.setEmissiveFactor([1, 1, 1].map(() => images.emissive.factor));
    }
    m.setExtras({
      source: key,
      ...(images.normal ? { normalFlippedY: images.normal.flippedY } : {}),
      ...(images.emissive ? { emissiveDefault: images.emissive.factor } : {}),
    });
    materialCache.set(key, m);
    return m;
  };

  // Geometry -------------------------------------------------------------------
  /**
   * Appends one primitive per draw group of `src`, in the space of
   * `originWorld`. `subset` limits it to those triangles (single-group meshes).
   */
  const addPrimitives = (gltfMesh, src, originWorld, subset = null) => {
    const g = src.geometry;
    const normalMatrix = new Matrix3().getNormalMatrix(src.matrixWorld);
    const { position, normal, uv } = g.attributes;
    const index = g.index?.array;
    const v = new Vector3();
    let triangles = 0;
    const groups = drawGroups(src);
    if (subset && groups.length > 1) throw new Error(`Triangle subsets need a single-material mesh: ${src.name}`);
    for (const group of groups) {
      const corners = subset ? subset.flatMap((t) => [t * 3, t * 3 + 1, t * 3 + 2]) : null;
      const n = corners ? corners.length : group.count;
      const pos = new Float32Array(n * 3);
      const nor = normal ? new Float32Array(n * 3) : null;
      const tex = uv ? new Float32Array(n * 2) : null;
      for (let i = 0; i < n; i++) {
        const c = corners ? corners[i] : group.start + i;
        const k = index ? index[c] : c;
        v.fromBufferAttribute(position, k).applyMatrix4(src.matrixWorld).sub(originWorld);
        pos.set([v.x, v.y, v.z], i * 3);
        if (nor) {
          v.fromBufferAttribute(normal, k).applyMatrix3(normalMatrix).normalize();
          nor.set([v.x, v.y, v.z], i * 3);
        }
        // FBX UVs have a bottom-left origin; glTF's is top-left.
        if (tex) tex.set([uv.getX(k), 1 - uv.getY(k)], i * 2);
      }
      const prim = doc
        .createPrimitive()
        .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(pos).setBuffer(buffer))
        .setMaterial(materialFor(group.material));
      if (nor) prim.setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(nor).setBuffer(buffer));
      if (tex) prim.setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(tex).setBuffer(buffer));
      gltfMesh.addPrimitive(prim);
      triangles += n / 3;
      report.meshes.push({ source: src.name, node: gltfMesh.getName(), material: group.material.name, triangles: n / 3 });
    }
    return triangles;
  };

  const node = (name, mesh) => {
    const n = doc.createNode(name);
    if (mesh) n.setMesh(mesh);
    return n;
  };

  const scene = doc.createScene("lc300");
  const rootNode = node("lc300").setExtras({
    source: "FINAL_MODEL_22.fbx",
    up: "+Y",
    forward: "+Z",
    left: "+X",
    units: "m",
    origin: "bottom centre",
  });
  scene.addChild(rootNode);

  // Static parts -------------------------------------------------------------
  const buckets = new Map();
  let wheelGroup = null;
  for (const child of root.children) {
    const part = sourcePart(child.name);
    if (part === "Tyre") {
      wheelGroup = child;
      continue;
    }
    const name = parts[part];
    if (!name) throw new Error(`No part mapping for "${child.name}" (part "${part}") in config.mjs`);
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(child);
  }

  for (const [name, sources] of buckets) {
    const mesh = doc.createMesh(name);
    const partNode = node(name, mesh);
    rootNode.addChild(partNode);
    let triangles = 0;
    const badgeMeshes = new Map();
    for (const src of sources) {
      const materialName = [src.material].flat()[0].name;
      const rules = badgeIslands.filter((r) => r.part === sourcePart(src.name) && r.material === materialName);
      if (!rules.length) {
        triangles += addPrimitives(mesh, src, origin);
        continue;
      }
      // Pull badge islands out of this mesh; everything else stays in the part.
      const rest = [];
      const picked = new Map();
      for (const island of islands(src)) {
        const box = island.box.clone().translate(origin.clone().negate());
        const rule = rules.find((r) => new Box3(new Vector3(...r.box[0]), new Vector3(...r.box[1])).containsBox(box));
        if (!rule) rest.push(...island.triangles);
        else {
          if (!picked.has(rule.name)) picked.set(rule.name, { triangles: [], islands: 0 });
          picked.get(rule.name).triangles.push(...island.triangles);
          picked.get(rule.name).islands++;
        }
      }
      triangles += addPrimitives(mesh, src, origin, rest);
      for (const [badgeName, { triangles: tris, islands: count }] of picked) {
        if (!badgeMeshes.has(badgeName)) {
          const badgeMesh = doc.createMesh(badgeName);
          badgeMeshes.set(badgeName, badgeMesh);
          partNode.addChild(node(badgeName, badgeMesh).setExtras({ badge: true }));
        }
        const t = addPrimitives(badgeMeshes.get(badgeName), src, origin, tris);
        report.badges.push({ name: badgeName, parent: name, source: src.name, islands: count, triangles: t });
      }
    }
    report.parts.push({ name, sources: sources.length, triangles });
  }

  // Wheels -------------------------------------------------------------------
  if (wheelGroup) {
    const wheelsNode = node("wheels");
    rootNode.addChild(wheelsNode);
    for (const tw of wheelGroup.children.filter((c) => c.isMesh)) {
      const tyreBox = geometryBox(tw);
      const hub = tyreBox.getCenter(new Vector3());
      const extent = tyreBox.getSize(new Vector3());
      const nodeWorld = new Vector3().setFromMatrixPosition(tw.matrixWorld);
      const id = `${hub.z > origin.z ? "F" : "R"}${hub.x > origin.x ? "L" : "R"}`;

      const hubNode = node(`hub_${id}`).setTranslation(hub.clone().sub(origin).toArray());
      const spinMesh = doc.createMesh(`wheel_${id}`);
      const spinNode = node(`wheel_${id}`, spinMesh);
      const caliperMesh = doc.createMesh(`caliper_${id}`);
      hubNode.addChild(spinNode);
      wheelsNode.addChild(hubNode);

      const entry = {
        id,
        hub: hub.clone().sub(origin).toArray(),
        sourcePivotError: nodeWorld.distanceTo(hub),
        axleIsX: extent.x < extent.y && extent.x < extent.z && Math.abs(extent.y - extent.z) < 0.02,
        diameter: Math.max(extent.y, extent.z),
        width: extent.x,
        spinning: [tw.name],
        calipers: [],
        badges: [],
      };
      addPrimitives(spinMesh, tw, hub);

      tw.traverse((c) => {
        if (c === tw || !c.isMesh) return;
        const center = geometryBox(c).getCenter(new Vector3());
        const radial = Math.hypot(center.y - hub.y, center.z - hub.z);
        if ([c.material].flat().some((m) => m.name === wheelBadgeMaterial)) {
          const badgeMesh = doc.createMesh(`badge_wheel_${id}`);
          const t = addPrimitives(badgeMesh, c, hub);
          spinNode.addChild(node(`badge_wheel_${id}`, badgeMesh).setExtras({ badge: true }));
          entry.badges.push(c.name);
          report.badges.push({ name: `badge_wheel_${id}`, parent: `wheel_${id}`, source: c.name, islands: 1, triangles: t });
        } else if (radial > caliperOffset) {
          addPrimitives(caliperMesh, c, hub);
          entry.calipers.push(`${c.name} (${(radial * 100).toFixed(1)} cm off-axle)`);
        } else {
          addPrimitives(spinMesh, c, hub);
          entry.spinning.push(`${c.name} (${(radial * 100).toFixed(1)} cm)`);
        }
      });
      if (caliperMesh.listPrimitives().length) hubNode.addChild(node(`caliper_${id}`, caliperMesh));
      else caliperMesh.dispose();
      report.wheels.push(entry);
    }
    report.wheels.sort((a, b) => a.id.localeCompare(b.id));
  }

  for (const rule of badgeIslands) {
    if (!report.badges.some((b) => b.name === rule.name)) throw new Error(`Badge rule "${rule.name}" matched no geometry`);
  }

  return { doc, report };
}
