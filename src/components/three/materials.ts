import {
  Color,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import type { PaintSettings, Tier } from "@/lib/experience/store";

/**
 * Material look-dev for public/models/lc300.glb.
 *
 * Every glTF material (MeshStandardMaterial) is upgraded to a
 * MeshPhysicalMaterial and tuned by name. Names come from the model pipeline
 * (scripts/model/config.mjs); see docs/ARCHITECTURE.md "Model contract".
 */

type Tuning = (m: MeshPhysicalMaterial, tier: Tier) => void;

const CHROME_ROUGHNESS = 0.12;

/** Drops the packed ORM maps so constant roughness/metalness take over. */
function constantSurface(m: MeshPhysicalMaterial, roughness: number, metalness: number) {
  m.roughnessMap = null;
  m.metalnessMap = null;
  m.roughness = roughness;
  m.metalness = metalness;
}

/**
 * Glass: a dark, glossy tint. Transmission (an extra render of the scene)
 * only on the high tier; elsewhere plain alpha blending.
 */
function glass(m: MeshPhysicalMaterial, tier: Tier, tint: string, opacity: number) {
  constantSurface(m, 0.04, 0);
  m.color.set(tint);
  m.envMapIntensity = 2.5;
  m.ior = 1.5;
  m.specularIntensity = 1;
  if (tier === "high") {
    m.transmission = 1;
    m.thickness = 0.004;
    m.transparent = false;
    m.opacity = 1;
  } else {
    m.transmission = 0;
    m.transparent = true;
    m.opacity = opacity;
  }
  m.depthWrite = false;
}

const tunings: Record<string, Tuning> = {
  paint: (m) => {
    // Colour, metalness and roughness come from the store (applyPaint).
    m.map = null;
    constantSurface(m, 0.32, 0.6);
    m.clearcoat = 1;
    m.clearcoatRoughness = 0.03;
    m.envMapIntensity = 1.2;
  },
  glass: (m, tier) => glass(m, tier, "#0b0e12", 0.6),
  lamp_lens: (m, tier) => glass(m, tier, "#ffffff", 0.12),
  lamp_lens_red: (m, tier) => glass(m, tier, "#7a0508", 0.65),
  mirror: (m) => {
    constantSurface(m, 0.02, 1);
    m.color.set("#e8e8e8");
  },
  // Chrome: badges and the grille mesh.
  badge: (m) => constantSurface(m, CHROME_ROUGHNESS, 1),
  grille_mesh: (m) => constantSurface(m, CHROME_ROUGHNESS, 1),
  // The shared trim atlas holds both chrome (light swatches) and black
  // plastic (dark swatches). Reusing the base colour as the metalness map
  // (blue channel ≈ luminance) makes the light swatches chrome and keeps the
  // dark ones dielectric. Glossy black plastic matches the real trim.
  trim: (m) => {
    constantSurface(m, CHROME_ROUGHNESS, 1);
    m.metalnessMap = m.map;
  },
  rim: (m) => {
    // Machined/painted silver rather than mirror chrome: slightly darker and
    // softer, so the spokes don't flare against the dark tyre.
    constantSurface(m, 0.3, 1);
    m.color.set("#c3c6ca");
  },
  tyre: (m) => {
    constantSurface(m, 0.9, 0);
    // Push the sidewall and tread relief (keeps the sign GLTFLoader set).
    m.normalScale.multiplyScalar(1.6);
    m.envMapIntensity = 0.6;
  },
  // Trim-atlas parts on the suspension (a clone, see CHASSIS_PARTS). The
  // atlas's light swatches would make them chrome; under the arches they
  // read as bright clutter behind the wheels. Dark, worn metal instead.
  trim_chassis: (m) => {
    constantSurface(m, 0.65, 0.4);
    m.metalnessMap = null;
    m.color.set("#2a2b2e");
    m.envMapIntensity = 0.5;
  },
  lamp: (m) => {
    // Intensity comes from the store (applyLamps).
    m.emissive = new Color("#ffffff");
  },
};

const upgraded = new WeakMap<Material, MeshPhysicalMaterial>();

function toPhysical(source: MeshStandardMaterial): MeshPhysicalMaterial {
  const physical = new MeshPhysicalMaterial();
  // MeshPhysicalMaterial.copy expects a physical source; copy the standard
  // properties only, then restore the physical shader defines.
  MeshStandardMaterial.prototype.copy.call(physical, source);
  physical.defines = { STANDARD: "", PHYSICAL: "" };
  physical.name = source.name;
  physical.userData = { ...source.userData };
  return physical;
}

export type MaterialHandles = {
  paint: MeshPhysicalMaterial[];
  /** Headlamps, DRLs, indicators. */
  lamps: MeshPhysicalMaterial[];
  /** Tail lamps: a clone of the lamp material on the rear parts, driven separately. */
  tailLamps: MeshPhysicalMaterial[];
  /** Meshes carrying cabin glass (faded while the camera passes through it). */
  glassMeshes: Mesh[];
  all: MeshPhysicalMaterial[];
};

/** Parts whose lamp material is a tail lamp. */
const REAR_PARTS = /^(lamp_rear|tailgate|diffuser_rear|bumper_rear)$/;

function inRearPart(object: Object3D) {
  for (let o: Object3D | null = object; o; o = o.parent) if (REAR_PARTS.test(o.name)) return true;
  return false;
}

const tailClones = new WeakMap<MeshPhysicalMaterial, MeshPhysicalMaterial>();

/** Parts whose trim material is chassis hardware, not exterior chrome. */
const CHASSIS_PARTS = /^suspension$/;
const chassisClones = new WeakMap<MeshPhysicalMaterial, MeshPhysicalMaterial>();

/**
 * Upgrades and tunes every material under `root` in place. Safe to call
 * again (a tier change re-tunes the cached physical materials).
 */
export function applyMaterials(root: Object3D, tier: Tier): MaterialHandles {
  const handles: MaterialHandles = { paint: [], lamps: [], tailLamps: [], glassMeshes: [], all: [] };
  const seen = new Set<MeshPhysicalMaterial>();
  const register = (physical: MeshPhysicalMaterial) => {
    if (seen.has(physical)) return;
    seen.add(physical);
    handles.all.push(physical);
    if (physical.name === "paint") handles.paint.push(physical);
    if (physical.name === "lamp") handles.lamps.push(physical);
    if (physical.name === "lamp_rear") handles.tailLamps.push(physical);
  };

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object;
    const rear = inRearPart(mesh);
    const chassis = CHASSIS_PARTS.test(mesh.name) || CHASSIS_PARTS.test(mesh.parent?.name ?? "");
    const convert = (material: Material) => {
      let physical = upgraded.get(material) ?? (material instanceof MeshPhysicalMaterial ? material : null);
      if (!physical) {
        if (!(material instanceof MeshStandardMaterial)) return material;
        physical = toPhysical(material);
        upgraded.set(material, physical);
        upgraded.set(physical, physical);
      }
      if (!seen.has(physical)) {
        tunings[physical.name]?.(physical, tier);
        physical.needsUpdate = true;
        register(physical);
      }
      if (physical.name === "glass" && !handles.glassMeshes.includes(mesh)) handles.glassMeshes.push(mesh);
      if (chassis && (physical.name === "trim" || physical.name === "trim_chassis")) {
        let dark = physical.name === "trim_chassis" ? physical : chassisClones.get(physical);
        if (!dark) {
          dark = physical.clone();
          dark.name = "trim_chassis";
          chassisClones.set(physical, dark);
        }
        if (!seen.has(dark)) {
          tunings.trim_chassis(dark, tier);
          dark.needsUpdate = true;
          register(dark);
        }
        return dark;
      }
      if (rear && (physical.name === "lamp" || physical.name === "lamp_rear")) {
        let tail = physical.name === "lamp_rear" ? physical : tailClones.get(physical);
        if (!tail) {
          tail = physical.clone();
          tail.name = "lamp_rear";
          tailClones.set(physical, tail);
        }
        register(tail);
        return tail;
      }
      return physical;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });

  return handles;
}

export function applyPaint(materials: MeshPhysicalMaterial[], paint: PaintSettings) {
  for (const m of materials) {
    m.color.set(paint.color);
    m.metalness = paint.metalness;
    m.roughness = paint.roughness;
    m.clearcoatRoughness = paint.clearcoatRoughness;
  }
}
