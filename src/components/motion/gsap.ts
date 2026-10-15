"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { easing } from "@/lib/motion/tokens";

/**
 * The one place GSAP plugins are registered (module scope, runs once). Import
 * gsap, ScrollTrigger and the eases from here, never from "gsap" directly, so
 * registration can't be skipped.
 */
gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

/** Motion tokens (src/lib/motion/tokens.ts) as GSAP eases. */
export const eases = {
  cinematic: CustomEase.create("lc300-cinematic", easing.cinematic.join(",")),
  drift: CustomEase.create("lc300-drift", easing.drift.join(",")),
  linear: "none",
} as const;

export { gsap, ScrollTrigger, useGSAP };
