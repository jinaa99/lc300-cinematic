"use client";

import { createPortal, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo } from "react";
import { CubeCamera, HalfFloatType, Scene, WebGLCubeRenderTarget } from "three";

type Props = {
  resolution: number;
  children: ReactNode;
  /** Receives the cube camera and virtual scene; the owner decides when to re-bake. */
  onReady: (value: { camera: CubeCamera; scene: Scene } | null) => void;
};

/**
 * Scene environment rendered from a small virtual scene (children) into a
 * cube map, used for all PBR reflections and ambient light. Unlike drei's
 * <Environment frames={Infinity}>, it is only re-rendered when the owner
 * asks (the studio controller re-bakes when the look changes), so a still
 * frame costs no cube renders.
 */
export function ReflectionEnvironment({ resolution, children, onReady }: Props) {
  const get = useThree((s) => s.get);
  const virtual = useMemo(() => new Scene(), []);
  const cube = useMemo(() => {
    const target = new WebGLCubeRenderTarget(resolution, { type: HalfFloatType });
    return { target, camera: new CubeCamera(0.5, 1000, target) };
  }, [resolution]);

  useEffect(() => {
    const { scene } = get();
    const previous = scene.environment;
    scene.environment = cube.target.texture;
    onReady({ camera: cube.camera, scene: virtual });
    return () => {
      scene.environment = previous;
      onReady(null);
      cube.target.dispose();
    };
  }, [get, cube, virtual, onReady]);

  return createPortal(children, virtual);
}
