"use client";

import { type KeyboardEvent, type PointerEvent, useId, useRef, useState, useSyncExternalStore } from "react";
import { useExperience } from "@/lib/experience/store";
import { motionMode, turntableInput } from "@/lib/motion/state";

/** Radians per pixel of drag, per arrow-key press, and per step button. */
const DRAG = 0.008;
const STEP = Math.PI / 12;
const BUTTON_STEP = Math.PI / 6;

const COARSE = "(pointer: coarse)";
const subscribeCoarse = (onChange: () => void) => {
  const query = window.matchMedia(COARSE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isCoarse = () => window.matchMedia(COARSE).matches;

type TurntableControlProps = {
  label: string;
  hint: string;
  touchHint: string;
  left: string;
  right: string;
};

/**
 * The turntable in the Colour chapter:
 *
 * - a drag area over the vehicle (right half from md up, top half on
 *   phones), also a keyboard slider (arrow keys). Vertical scrolling still
 *   works on touch (touch-action: pan-y). A small cue marks it until the
 *   first turn.
 * - visible step buttons under the swatches, so turning is discoverable
 *   and possible without dragging.
 *
 * Rotation is independent of scroll; the canvas weighs it in only while
 * the Colour chapter is on screen. Hidden when the 3D layer isn't live.
 */
export function TurntableControl({ label, hint, touchHint, left, right }: TurntableControlProps) {
  const live = useExperience((s) => s.status === "live" && s.capability !== "off");
  const last = useRef<number | null>(null);
  const hintId = useId();
  const touch = useSyncExternalStore(subscribeCoarse, isCoarse, () => false);
  const [dragging, setDragging] = useState(false);
  const [used, setUsed] = useState(false);
  // Announced angle (degrees, -180..180); updated on key presses and drag end.
  const [degrees, setDegrees] = useState(0);

  if (!live) return null;

  const announce = () => {
    const wrapped = Math.atan2(Math.sin(turntableInput.yaw), Math.cos(turntableInput.yaw));
    setDegrees(Math.round((wrapped * 180) / Math.PI));
  };
  const turn = (radians: number) => {
    turntableInput.yaw += radians;
    motionMode.invalidate?.();
    setUsed(true);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    last.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (last.current === null) return;
    turn((e.clientX - last.current) * DRAG);
    last.current = e.clientX;
  };
  const onPointerUp = () => {
    last.current = null;
    setDragging(false);
    announce();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") turn(-STEP);
    else if (e.key === "ArrowRight") turn(STEP);
    else return;
    e.preventDefault();
    announce();
  };
  const step = (radians: number) => {
    turn(radians);
    announce();
  };

  const cue = touch ? touchHint : hint;
  const button =
    "grid size-11 place-items-center rounded-full border border-ink-500 text-silver-300 transition-colors duration-500 ease-cinematic hover:border-silver-400 hover:text-silver-50 active:bg-ink-700";

  return (
    <>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-describedby={hintId}
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={degrees}
        aria-valuetext={`${degrees}°`}
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
        {/* Drag cue under the vehicle, until the first turn. Not on phones,
            where it would sit on the title; the row below carries the hint. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 hidden justify-center md:flex transition-opacity duration-700 ease-cinematic bottom-[9vh] ${
            used || dragging ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex items-center gap-3 rounded-full border border-silver-50/10 bg-ink-950/60 px-4 py-2 text-eyebrow uppercase text-silver-300 backdrop-blur-sm">
            <ArrowIcon direction="left" />
            {cue}
            <ArrowIcon direction="right" />
          </span>
        </span>
      </div>

      <div className="mt-4 flex max-w-copy items-center gap-3 md:mt-6">
        <button type="button" className={button} aria-label={left} onClick={() => step(-BUTTON_STEP)}>
          <ArrowIcon direction="left" />
        </button>
        <button type="button" className={button} aria-label={right} onClick={() => step(BUTTON_STEP)}>
          <ArrowIcon direction="right" />
        </button>
        <p className="ml-2 text-xs text-silver-500">{cue}</p>
      </div>
    </>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" className={direction === "right" ? "-scale-x-100" : undefined}>
      {/* A curved arrow: turning, not navigating. */}
      <path d="M11.5 9.5A5 5 0 1 0 4 3.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M4.5 0.8 4 3.2l2.4.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
