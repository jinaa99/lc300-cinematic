"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { createCameraController } from "./controllers/camera";

/**
 * Drives the camera from the motion proxy every frame (see
 * controllers/camera.ts). ?debug free camera: orbit controls take over and
 * the probe records the camera for "copy camera".
 */
export function CameraDirector({ free }: { free: boolean }) {
  const controller = useMemo(() => createCameraController(), []);
  const controls = useRef<OrbitControlsImpl>(null);
  useEffect(() => controller.track(), [controller]);

  useFrame(({ camera, size }, delta) => {
    if (free) controller.probe(camera as PerspectiveCamera, controls.current?.target);
    else controller.update(camera as PerspectiveCamera, size.width, size.height, delta);
  });

  return free ? <OrbitControls ref={controls} makeDefault target={controller.initialTarget} /> : null;
}
