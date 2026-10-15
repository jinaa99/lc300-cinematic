"use client";

import { useEffect, useId, useRef, useState } from "react";

type MobileNavProps = {
  label: string;
  openLabel: string;
  closeLabel: string;
  items: { href: string; label: string }[];
};

/**
 * Chapter menu below xl, where the inline nav doesn't fit: a disclosure
 * button and a panel under the header. Escape closes it and returns focus
 * to the button; choosing a chapter closes it. Without JavaScript it stays
 * closed and the page reads top to bottom.
 */
export function MobileNav({ label, openLabel, closeLabel, items }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    // Closes when the viewport widens past xl (the inline nav takes over).
    const wide = window.matchMedia("(min-width: 80rem)");
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 py-3 text-eyebrow uppercase text-silver-300 transition-colors duration-500 ease-cinematic hover:text-silver-50"
      >
        <span aria-hidden className="flex w-5 flex-col gap-1.5">
          <span
            className={`h-px w-full bg-current transition-transform duration-500 ease-cinematic ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-full bg-current transition-transform duration-500 ease-cinematic ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </span>
        {open ? closeLabel : openLabel}
      </button>

      <nav
        id={panelId}
        aria-label={label}
        hidden={!open}
        className="absolute inset-x-0 top-full border-y border-ink-700 bg-ink-950/95 backdrop-blur-md"
      >
        <ul className="frame grid grid-cols-1 py-4 sm:grid-cols-2 sm:gap-x-10">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border-b border-ink-800 py-4 text-eyebrow uppercase text-silver-300 transition-colors duration-500 ease-cinematic hover:text-silver-50"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
