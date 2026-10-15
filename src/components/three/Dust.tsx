"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Points } from "three";
import { createDust } from "./controllers/dust";

/** Dust from the tyres (Terrain chapter). Medium and high tiers; the caller decides. */
export function Dust() {
  const dust = useMemo(() => createDust(), []);
  const points = useRef<Points>(null);
  useEffect(() => dust.track(), [dust]);
  useFrame((_, delta) => dust.update(points.current, delta));
  return <points ref={points} geometry={dust.geometry} material={dust.material} frustumCulled={false} />;
}
