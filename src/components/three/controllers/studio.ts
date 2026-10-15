import {
  Color,
  type CubeCamera,
  type Fog,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type Scene,
  type WebGLRenderer,
} from "three";
import { intro, motion } from "@/lib/motion/state";

/**
 * Scene colours for the steppe dusk, sampled from the backplate
 * (public/models/env/belfast_sunset_backplate_4k.webp): haze between the
 * horizon (#674135) and the sky (#8e8ca4); ground from the near field
 * (#4c3430), darkened for the floor. Scene data, not UI colours.
 */
const STEPPE_FOG = new Color("#6f5a5c");
const STEPPE_GROUND = new Color("#3b2a26");

export type Lightformer = { mesh: Mesh; base: number; kind: "studio" | "rim" };

type StudioParts = {
  ink: Color;
  floorColor: Color;
  /** Spheres inside the reflection environment. */
  studioRoom: Mesh;
  steppeRoom: Mesh;
  lightformers: Lightformer[];
  /** The visible steppe sky/ground behind the vehicle. */
  backplate: Mesh;
  floor: Mesh;
};

const opacity = (mesh: Mesh, value: number) => {
  const m = mesh.material as Material;
  m.opacity = value;
  mesh.visible = value > 0.002;
};

/**
 * Per-frame environment driver: blends the dark studio into the steppe at
 * dusk (reflections, backplate, fog, floor) and down into night, and sets
 * the lightformers (rim included) from the motion proxy.
 */
export function createStudioController(parts: StudioParts) {
  const fogColor = new Color();
  const floorColor = new Color();
  // Inputs of the last reflection bake; the cube map is re-rendered only
  // when one of them has moved.
  let baked = "";

  return {
    /** Applies the look; returns true when the reflection environment needs a re-bake. */
    update(scene: Scene, storeEnvironmentIntensity: number): boolean {
      const steppe = motion.steppe;
      const night = motion.night;
      const studioWeight = (1 - steppe) * (1 - 0.85 * night);

      // Reflection environment.
      opacity(parts.studioRoom, 0.18 * (1 - steppe) * (1 - 0.7 * night));
      opacity(parts.steppeRoom, steppe * (1 - 0.8 * night));
      for (const { mesh, base, kind } of parts.lightformers) {
        const intensity =
          kind === "rim" ? base * motion.rim * intro.value * (1 + night) : base * studioWeight * (0.25 + 0.75 * intro.value);
        (mesh.material as MeshBasicMaterial).color.setScalar(intensity);
        mesh.visible = intensity > 0.001;
      }
      scene.environmentIntensity = storeEnvironmentIntensity * motion.envIntensity * (1 - 0.6 * night);

      // What the camera sees.
      opacity(parts.backplate, steppe * (1 - night));
      fogColor.copy(parts.ink).lerp(STEPPE_FOG, steppe * (1 - night));
      if (scene.fog) {
        const fog = scene.fog as Fog;
        fog.color.copy(fogColor);
        fog.near = 14 - 4 * steppe;
        fog.far = 32 + 23 * steppe;
      }
      floorColor.copy(parts.floorColor).lerp(STEPPE_GROUND, steppe * (1 - night));
      const floor = parts.floor.material as Material & { color?: Color; mixStrength?: number };
      floor.color?.copy(floorColor);
      if (floor.mixStrength !== undefined) floor.mixStrength = 6 * (1 - 0.95 * steppe);

      const key = [steppe, night, motion.rim, intro.value].map((v) => v.toFixed(3)).join();
      if (key === baked) return false;
      baked = key;
      return true;
    },
  };
}

type SetKey = "studio" | "steppe" | "backplate" | "floor";

/**
 * Collects the set's meshes through ref callbacks and builds the controller
 * on the first frame they are all mounted. Created once per Studio.
 */
export function createStudioSet(ink: string, floorColor: string) {
  const meshes: Record<SetKey, Mesh | null> = { studio: null, steppe: null, backplate: null, floor: null };
  const lightformers: Lightformer[] = [];
  let controller: ReturnType<typeof createStudioController> | null = null;
  let reflection: { camera: CubeCamera; scene: Scene } | null = null;

  return {
    mesh: (key: SetKey) => (mesh: Mesh | null) => {
      meshes[key] = mesh;
      controller = null;
    },
    card:
      (base: number, kind: Lightformer["kind"] = "studio") =>
      (mesh: Mesh | null) => {
        if (mesh && !lightformers.some((c) => c.mesh === mesh)) lightformers.push({ mesh, base, kind });
      },
    /** The reflection cube camera and its virtual scene (ReflectionEnvironment). */
    reflection(value: { camera: CubeCamera; scene: Scene } | null) {
      reflection = value;
      controller = null;
    },
    update(gl: WebGLRenderer, scene: Scene, storeEnvironmentIntensity: number) {
      const { studio, steppe, backplate, floor } = meshes;
      if (!studio || !steppe || !backplate || !floor) return;
      controller ??= createStudioController({
        ink: new Color(ink),
        floorColor: new Color(floorColor),
        studioRoom: studio,
        steppeRoom: steppe,
        lightformers,
        backplate,
        floor,
      });
      if (controller.update(scene, storeEnvironmentIntensity) && reflection) {
        // The effect composer turns autoClear off; without clearing, the
        // cube faces would accumulate the blended spheres on every bake.
        const autoClear = gl.autoClear;
        gl.autoClear = true;
        reflection.camera.update(gl, reflection.scene);
        gl.autoClear = autoClear;
      }
    },
  };
}
