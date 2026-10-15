"use client";

import { type KeyboardEvent, type PointerEvent, useId, useRef, useState } from "react";
import { useExperience } from "@/lib/experience/store";
import { motionMode, turntableInput } from "@/lib/motion/state";

/** Radians per pixel of drag, and per arrow-key press. */
const DRAG = 0.008;
const STEP = Math.PI / 12;

/**
 * The turntable handle in the Colour chapter: a drag area over the vehicle
 * (right half from md up, top half on phones) plus arrow keys. Rotation is
 * independent of scroll; the canvas weighs it in only while the Colour
 * chapter is on screen. Vertical scrolling still works on touch
 * (touch-action: pan-y). Hidden when the 3D layer isn't live.
 */
export function TurntableControl({ label, hint }: { label: string; hint: string }) {
  const live = useExperience((s) => s.status === "live" && s.capability !== "off");
  const last = useRef<number | null>(null);
  const hintId = useId();
  // Announced angle (degrees, -180..180); updated on key presses and drag end.
  const [degrees, setDegrees] = useState(0);
  const announce = () => {
    const wrapped = Math.atan2(Math.sin(turntableInput.yaw), Math.cos(turntableInput.yaw));
    setDegrees(Math.round((wrapped * 180) / Math.PI));
  };

  if (!live) return null;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    last.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (last.current === null) return;
    turntableInput.yaw += (e.clientX - last.current) * DRAG;
    last.current = e.clientX;
    motionMode.invalidate?.();
  };
  const onPointerUp = () => {
    last.current = null;
    announce();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") turntableInput.yaw -= STEP;
    else if (e.key === "ArrowRight") turntableInput.yaw += STEP;
    else return;
    e.preventDefault();
    motionMode.invalidate?.();
    announce();
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-describedby={hintId}
      aria-valuemin={-180}
      aria-valuemax={180}
      aria-valuenow={degrees}
      aria-valuetext={`${degrees}°`}
      title={hint}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="absolute inset-x-0 top-0 h-1/2 cursor-grab touch-pan-y focus-visible:outline-offset-[-8px] active:cursor-grabbing md:inset-y-0 md:left-1/2 md:right-0 md:h-auto"
    >
      <span id={hintId} className="sr-only">
        {hint}
      </span>
    </div>
  );
}
