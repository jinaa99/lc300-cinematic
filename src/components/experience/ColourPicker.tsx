"use client";

import type { FinishId } from "@/content/copy";
import { type Finish, finishes } from "@/content/finishes";
import { useExperience } from "@/lib/experience/store";

type ColourPickerProps = {
  label: string;
  names: Record<FinishId, string>;
  note: string;
  unavailable: string;
};

/**
 * Paint finish picker (client island inside the Colour chapter). Writes to
 * the experience store; the 3D model repaints. Server HTML and devices
 * without the 3D layer get the swatches as a disabled, labelled list.
 */
export function ColourPicker({ label, names, note, unavailable }: ColourPickerProps) {
  const live = useExperience((s) => s.status === "live" && s.capability !== "off");
  const current = useExperience((s) => s.paint.color);
  const setPaint = useExperience((s) => s.setPaint);

  const choose = ({ color, metalness, roughness, clearcoatRoughness }: Finish) =>
    setPaint({ color, metalness, roughness, clearcoatRoughness });

  return (
    <div className="mt-12 max-w-copy border-t border-ink-700 pt-8">
      <p id="finish-label" className="text-eyebrow uppercase text-silver-400">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby="finish-label" className="mt-6 flex flex-wrap gap-x-6 gap-y-5">
        {finishes.map((finish) => {
          const selected = current === finish.color;
          return (
            <button
              key={finish.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!live}
              onClick={() => choose(finish)}
              className="group flex items-center gap-3 text-sm text-silver-300 transition-colors duration-500 ease-cinematic enabled:hover:text-silver-50 disabled:cursor-not-allowed disabled:opacity-60 aria-checked:text-silver-50"
            >
              {/* Swatch: the finish's own paint colour (data, not a UI token). */}
              <span
                aria-hidden
                className="size-7 rounded-full border border-silver-500/40 ring-offset-2 ring-offset-ink-950 transition-shadow duration-500 ease-cinematic group-aria-checked:ring-1 group-aria-checked:ring-silver-100"
                style={{ backgroundColor: finish.color }}
              />
              {names[finish.id]}
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-silver-500">{live ? note : `${unavailable} ${note}`}</p>
    </div>
  );
}
