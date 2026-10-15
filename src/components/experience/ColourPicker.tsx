"use client";

import { type KeyboardEvent, useRef } from "react";
import type { FinishId } from "@/content/copy";
import { type Finish, finishes } from "@/content/finishes";
import { cn } from "@/lib/cn";
import { useExperience } from "@/lib/experience/store";

type ColourPickerProps = {
  label: string;
  names: Record<FinishId, string>;
  note: string;
  loading: string;
  unavailable: string;
};

/**
 * Paint finish picker (client island inside the Colour chapter). Writes to
 * the experience store; the 3D model repaints. Server HTML and devices
 * without the 3D layer get the swatches as a disabled, labelled list.
 *
 * A radio group with a roving tab stop: Tab reaches the checked swatch,
 * arrow keys move and select (WAI-ARIA radio group pattern).
 */
export function ColourPicker({ label, names, note, loading, unavailable }: ColourPickerProps) {
  const live = useExperience((s) => s.status === "live" && s.capability !== "off");
  // Capable device, 3D still on its way. Null capability (server HTML, no JS,
  // GPU check running) reads as unavailable, so hydration matches.
  const pending = useExperience((s) => s.capability !== null && s.capability !== "off" && s.status !== "failed");
  const current = useExperience((s) => s.paint.color);
  const setPaint = useExperience((s) => s.setPaint);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = ({ color, metalness, roughness, clearcoatRoughness }: Finish) =>
    setPaint({ color, metalness, roughness, clearcoatRoughness });

  const selectedIndex = Math.max(
    0,
    finishes.findIndex((f) => f.color === current),
  );
  const selected = finishes[selectedIndex];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const edge = { Home: 0, End: finishes.length - 1 }[e.key];
    if (step === undefined && edge === undefined) return;
    e.preventDefault();
    const next = edge ?? (selectedIndex + step! + finishes.length) % finishes.length;
    choose(finishes[next]);
    buttons.current[next]?.focus();
  };

  const state = live ? "live" : pending ? "loading" : "unavailable";

  return (
    <div className="mt-8 max-w-copy border-t border-ink-700 pt-6 md:mt-12 md:pt-8" data-state={state}>
      <div className="flex items-baseline justify-between gap-6">
        <p id="finish-label" className="text-eyebrow uppercase text-silver-400">
          {label}
        </p>
        {/* The checked radio already announces it; this is the visual readout. */}
        <p aria-hidden className={cn("text-sm text-silver-100 transition-opacity duration-500", !live && "opacity-0")}>
          {names[selected.id]}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="finish-label"
        aria-busy={state === "loading"}
        onKeyDown={onKeyDown}
        className="mt-4 grid grid-cols-5 gap-1 sm:gap-3 md:mt-6"
      >
        {finishes.map((finish, i) => {
          const checked = i === selectedIndex;
          return (
            <button
              key={finish.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={!live}
              onClick={() => choose(finish)}
              className="group flex min-h-11 flex-col items-center gap-3 rounded-sm py-1 text-silver-400 transition-colors duration-500 ease-cinematic focus-visible:outline-offset-2 enabled:hover:text-silver-100 disabled:cursor-not-allowed aria-checked:text-silver-50"
            >
              {/* Swatch: the finish's own paint colour (data, not a UI token),
                  with a soft highlight so it reads as a painted surface. */}
              <span aria-hidden className="relative grid size-11 place-items-center">
                {/* Selection ring: drawn when checked, previewed on hover. */}
                <span
                  className={cn(
                    "absolute inset-0 rounded-full border transition duration-500 ease-cinematic",
                    checked
                      ? "scale-100 border-silver-100 opacity-100"
                      : "scale-90 border-silver-500 opacity-0 group-enabled:group-hover:scale-100 group-enabled:group-hover:opacity-70",
                  )}
                />
                <span
                  className={cn(
                    "size-8 rounded-full border border-silver-50/15 transition duration-500 ease-cinematic",
                    state === "loading" && "animate-pulse opacity-60",
                    state === "unavailable" && "opacity-40 saturate-50",
                    live && "group-hover:scale-105",
                  )}
                  style={{
                    backgroundColor: finish.color,
                    backgroundImage:
                      "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.35), transparent 55%), linear-gradient(160deg, transparent 50%, rgb(0 0 0 / 0.35))",
                  }}
                />
              </span>
              <span className="text-center text-[0.6875rem] leading-tight tracking-wide">{names[finish.id]}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs md:mt-6 leading-relaxed text-silver-500" aria-live="polite">
        {state === "loading" && (
          <span aria-hidden className="mt-1.5 size-1 shrink-0 animate-pulse rounded-full bg-silver-300" />
        )}
        <span>{live ? note : `${state === "loading" ? loading : unavailable} ${note}`}</span>
      </p>
    </div>
  );
}
