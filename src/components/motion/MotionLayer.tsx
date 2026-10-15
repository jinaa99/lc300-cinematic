"use client";

import { FrameOverlays } from "@/components/experience/FrameOverlays";
import ScrollDirector from "./ScrollDirector";

/**
 * Scroll choreography for the 3D layer: the master timeline plus the
 * letterbox / fade overlays. Loaded client-only, with the canvas, so GSAP
 * never runs on the server or on devices without the 3D layer.
 */
export default function MotionLayer() {
  return (
    <>
      <ScrollDirector />
      <FrameOverlays />
    </>
  );
}
