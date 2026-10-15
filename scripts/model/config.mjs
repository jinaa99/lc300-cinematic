/**
 * LC300 model pipeline configuration.
 *
 * Everything that depends on how this particular FBX was authored lives here:
 * file locations, how source parts map to runtime node names, and how each
 * Unreal-style material instance maps to a glTF PBR material. The pipeline
 * code (convert/textures/build) stays generic.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const paths = {
  fbx: path.join(ROOT, "assets-src/lc300/source/FINAL_MODEL_22.fbx"),
  textures: path.join(ROOT, "assets-src/lc300/source"),
  /** Intermediate files and reports (git-ignored with the rest of assets-src). */
  build: path.join(ROOT, "assets-src/lc300/build"),
  out: path.join(ROOT, "public/models/lc300.glb"),
};

export const budget = {
  bytes: 8 * 1024 * 1024,
  triangles: 400_000,
  maxTextureSize: 2048,
};

/**
 * Source part (the `<Part>` in `TSK_<Part>_101_…` / `TSM_<Part>_101_…`) →
 * runtime node name. Sides follow the vehicle: L = driver's left = +X.
 */
export const parts = {
  Body: "body",
  Body_Bones: "cockpit",
  Bumper_B: "bumper_rear",
  Bumper_F: "bumper_front",
  Diffuser_B: "diffuser_rear",
  Door_BL: "door_RL",
  Door_BR: "door_RR",
  Door_FL: "door_FL",
  Door_FR: "door_FR",
  Engine: "engine",
  Exhaust: "exhaust",
  Fender_B: "fender_rear",
  Fender_F: "fender_front",
  Hood: "hood",
  Light_B: "lamp_rear",
  Light_F: "lamp_front",
  Roof: "roof",
  SideMirror_L: "mirror_L",
  SideMirror_R: "mirror_R",
  SideSkirts: "side_skirts",
  Suspension: "suspension",
  Trunk: "tailgate",
  /** Group holding the four wheel assemblies (TW1–TW4). */
  Tyre: "wheels",
};

/**
 * Badges become their own `badge_*` nodes (extras.badge = true) so the site
 * can toggle them with `siteConfig.showBadges`.
 *
 * Wheel centre caps are separate meshes with the logo material. The body
 * badges are not: they are disconnected islands inside the trim meshes
 * (the logo-material meshes on the bumper and tailgate are the parking
 * cameras). Each rule extracts every island of `part` + `material` whose
 * bounding box lies entirely inside `box` (metres, output coordinates).
 */
export const wheelBadgeMaterial = "T:MI_Logo_007";

export const badgeIslands = [
  { name: "badge_front", part: "Bumper_F", material: "T:MI_Exhaust_030", box: [[-0.1, 0.93, 2.44], [0.1, 1.07, 2.48]] },
  { name: "badge_rear", part: "Trunk", material: "T:MI_Exhaust_030", box: [[-0.09, 1.19, -2.44], [0.09, 1.3, -2.41]] },
  // "LAND CRUISER" lettering under the rear emblem.
  { name: "badge_rear_name", part: "Trunk", material: "T:MI_Exhaust_030", box: [[-0.31, 1.14, -2.44], [0.31, 1.175, -2.415]] },
  // Grade badge, right of the tailgate.
  { name: "badge_rear_grade", part: "Trunk", material: "T:MI_Exhaust_030", box: [[-0.75, 1.02, -2.4], [-0.55, 1.07, -2.32]] },
  // Engine badge, left of the tailgate.
  { name: "badge_rear_engine", part: "Trunk", material: "T:MI_Exhaust_030", box: [[0.55, 1.02, -2.4], [0.75, 1.07, -2.32]] },
];

/**
 * Inside a wheel assembly, a mesh whose bounding-box centre sits further than
 * this from the axle (in the wheel's YZ plane) is not rotationally symmetric:
 * it is a brake caliper and must not spin with the wheel.
 */
export const caliperOffset = 0.05; // metres

/**
 * FBX material → glTF material.
 *
 * `set` names a texture family in the source folder: T_<set>_D (base colour),
 * _N (normal), _RME (R roughness, G metallic, B emissive mask), _E (emissive),
 * _AO (ambient occlusion, R channel). Missing files are skipped.
 *
 * The FBX itself only links D and a few N maps; everything else is bound here
 * by naming convention (see inspect report).
 */
export const materials = {
  "T:MI_1350010001_044": {
    name: "paint",
    set: "Paint",
    // T_Paint_D alpha is only a palette strip, not opacity.
    alpha: "OPAQUE",
  },
  "T:MI_Exhaust_030": {
    // Shared exterior trim atlas ("tongyong" = generic). No RME in the source.
    name: "trim",
    base: "T_tongyong_D",
    roughness: 0.4,
    metallic: 0.0,
  },
  "T:MI_Cabin_A_008": { name: "interior", set: "Cabin", alpha: "MASK", emissiveFactor: 0 },
  "T:MI_Cabin_Leather_A_008": { name: "interior_leather", set: "Cabin", alpha: "MASK", emissiveFactor: 0 },
  "T:MI_Cabin_Grid_A_003": { name: "grille_mesh", set: "Grid_A" },
  "T:MI_Cabin_Grid_B_012": { name: "wood", set: "Grid_B" },
  "T:MI_Dashboard_007": { name: "dashboard", set: "Dashboard", alpha: "OPAQUE", emissiveFactor: 0 },
  "T:MI_Engine_Plastic_A1": { name: "engine", set: "Engine", alpha: "MASK" },
  "T:MI_Light_011": { name: "lamp", set: "Light", alpha: "OPAQUE" },
  "T:MI_Logo_007": { name: "badge", set: "Logo", alpha: "MASK" },
  "T:MI_Suspension_002": { name: "suspension", set: "Suspension" },
  // The FBX names it "Suspension_B1" but binds T_Tyre_D/N: it is the tyre.
  "T:MI_Suspension_B1": { name: "tyre", set: "Tyre" },
  // T_Brake_E is a "hot brake disc" glow (RME emissive mask is 0): not shipped.
  "T:MI_Change_Brake_002": { name: "brake", set: "Brake", alpha: "OPAQUE", emissive: false },
  "rim:MI_ChangeA_Rim_002": { name: "rim", set: "Rim", alpha: "OPAQUE" },
  "T:MI_Glass_011": {
    name: "glass",
    color: [0.02, 0.025, 0.03, 0.3],
    roughness: 0.05,
    metallic: 0,
    alpha: "BLEND",
    doubleSided: true,
  },
  "T:MI_Glass_Light_005": {
    name: "lamp_lens",
    color: [1, 1, 1, 0.08],
    roughness: 0.02,
    metallic: 0,
    alpha: "BLEND",
  },
  phong1: {
    // Tail-lamp red lens.
    name: "lamp_lens_red",
    color: [0.45, 0.01, 0.01, 0.6],
    roughness: 0.05,
    metallic: 0,
    alpha: "BLEND",
  },
  Mirror: { name: "mirror", color: [0.9, 0.9, 0.9, 1], roughness: 0.02, metallic: 1 },
};

/**
 * Edits applied to source textures before anything reads them
 * (see edits.mjs). Output goes to assets-src/lc300/build/edited/.
 */
const sidewallLettering = {
  type: "ringFill",
  reason: 'remove "RACING MASTER" sidewall lettering (game brand)',
  center: [0.5, 0.5],
  // Lettering band, 210–246 px on the 512 px tyre texture.
  radii: [210 / 512, 246 / 512],
  // Angles where the band carries no lettering, used as the fill profile.
  cleanAngles: [
    [40, 110],
    [215, 285],
  ],
};
export const textureEdits = {
  T_Tyre_D: [sidewallLettering],
  T_Tyre_N: [sidewallLettering],
  T_Tyre_RME: [sidewallLettering],
};

/**
 * Source textures that are never shipped, with the reason (shown in reports).
 */
export const excludedTextures = {
  T_InteriorRef_D: "Spherical reflection capture (fake env reflection), replaced by real-time environment lighting",
  T_EngineRef_D: "Spherical reflection capture (fake env reflection), replaced by real-time environment lighting",
  T_Cabin_DP_D: "Not referenced by any mesh UVs (alternate interior atlas)",
  T_Cabin_DP_N: "Not referenced by any mesh UVs (alternate interior atlas)",
  T_Cabin_DP_RME: "Not referenced by any mesh UVs (alternate interior atlas)",
  T_Cabin_DP_E: "Empty (black)",
  T_Engine_E: "Empty (black)",
  T_Brake_E: "Hot-brake glow effect; RME emissive mask is 0",
  T_Leather_N: "64px tiling detail normal; glTF has no detail-normal slot",
};
