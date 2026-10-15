"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useState } from "react";
import { useExperienceGate } from "@/hooks/useExperienceCapability";
import { selectTier, type Tier, useExperience } from "@/lib/experience/store";

// ssr: false is only allowed in Client Components; this is the boundary.
// Devices that fail the capability gate never request these chunks.
const Experience = dynamic(() => import("@/components/three/Experience"), { ssr: false });
const MotionLayer = dynamic(() => import("@/components/motion/MotionLayer"), { ssr: false });
const LoadingIndicator = dynamic(() => import("./LoadingIndicator"), { ssr: false });
const DebugPanel = dynamic(() => import("@/components/three/DebugPanel"), { ssr: false });

class ExperienceBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const TIERS: Tier[] = ["off", "low", "medium", "high"];

/**
 * Progressive-enhancement host for the 3D layer. Renders nothing on the
 * server or on devices that fail the gate, so the static layer (posters)
 * stays as is. Once the canvas has compiled and rendered, it sets
 * <html data-experience="live">, which fades the posters (globals.css).
 *
 * Gate: reduced motion / Save-Data / no WebGL2 → off at once; otherwise the
 * GPU benchmark lookup picks low, medium or high (or off for very weak
 * GPUs). ?tier=off|low|medium|high overrides it for testing.
 */
export function ExperienceRoot({ loadingLabel }: { loadingLabel: string }) {
  const gate = useExperienceGate();
  const setCapability = useExperience((s) => s.setCapability);
  const capability = useExperience((s) => s.capability);
  const tier = useExperience(selectTier);
  const status = useExperience((s) => s.status);
  const setStatus = useExperience((s) => s.setStatus);
  const setHidden = useExperience((s) => s.setHidden);
  const debug = useExperience((s) => s.debug);
  const setDebug = useExperience((s) => s.setDebug);

  // The 3D layer is an enhancement: start it only after the page has loaded
  // and the main thread is idle, so it never competes with the hero's first
  // paint or with hydration.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (tier === "off" || started) return;
    let idle = 0;
    let timer = 0;
    const begin = () => {
      // Safari has no requestIdleCallback.
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(() => setStarted(true), { timeout: 2500 });
      } else timer = setTimeout(() => setStarted(true), 600) as unknown as number;
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    return () => {
      window.removeEventListener("load", begin);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [tier, started]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("tier") as Tier | null;
    setDebug(params.has("debug"));
    if (forced && TIERS.includes(forced)) {
      setCapability(forced);
      return;
    }
    if (gate === "off") {
      setCapability("off");
      return;
    }
    let cancelled = false;
    void import("@/lib/experience/gpu").then(({ detectTier }) =>
      detectTier().then((detected) => !cancelled && setCapability(detected)),
    );
    return () => {
      cancelled = true;
    };
  }, [gate, setCapability, setDebug]);

  // Stop rendering when the canvas can't be seen: tab hidden, or the page
  // scrolled past <main> (only the footer on screen). The fade-to-ink at the
  // end is reported by FrameOverlays through the same flag.
  useEffect(() => {
    if (tier === "off") return;
    const main = document.getElementById("main");
    let tabHidden = document.visibilityState === "hidden";
    let offscreen = false;
    const update = () => setHidden(tabHidden || offscreen);
    const onVisibility = () => {
      tabHidden = document.visibilityState === "hidden";
      update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      update();
    });
    if (main) observer.observe(main);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tier, setHidden]);

  // ?debug: hand pointer input to the canvas (orbit) instead of the page.
  useEffect(() => {
    const root = document.documentElement;
    if (debug) root.dataset.experienceDebug = "";
    else delete root.dataset.experienceDebug;
  }, [debug]);

  // Effective tier on <html data-experience-tier>, for QA and screenshots.
  useEffect(() => {
    if (capability) document.documentElement.dataset.experienceTier = tier;
  }, [capability, tier]);

  useEffect(() => {
    const root = document.documentElement;
    if (status === "live" && tier !== "off") root.dataset.experience = "live";
    else delete root.dataset.experience;
    return () => {
      delete root.dataset.experience;
    };
  }, [status, tier]);

  // Failed (load error, render error or lost WebGL context): drop the canvas
  // entirely so the static layer is all that remains.
  if (tier === "off" || !started || status === "failed") return debug ? <DebugPanel /> : null;

  return (
    <>
      <div
        aria-hidden
        className={`fixed inset-x-0 top-0 z-0 h-lvh w-full ${debug ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <ExperienceBoundary onError={() => setStatus("failed")}>
          <Experience />
          <MotionLayer />
        </ExperienceBoundary>
      </div>
      <LoadingIndicator label={loadingLabel} />
      {debug && <DebugPanel />}
    </>
  );
}
