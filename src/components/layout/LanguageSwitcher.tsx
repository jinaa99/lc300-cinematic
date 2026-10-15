"use client";

import type { MouseEvent } from "react";
import { LOCALE_COOKIE, type Locale, localeHome, locales } from "@/content/copy";

type LanguageSwitcherProps = {
  current: Locale;
  /** Accessible name of the group, in the current language. */
  label: string;
  /** Each language's name in that language ("English", "Монгол"). */
  names: Record<Locale, string>;
};

/** One year, in seconds. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * EN / MN in the header. Plain links to each locale's home, so it works
 * without JavaScript. Switching is always a full document load, never a
 * client-side navigation: with Cache Components the router keeps the
 * previous page mounted (hidden), which would leave both languages' chapters
 * and their ids in the DOM. With JavaScript it also:
 * - keeps the chapter you are on (the #hash) and any query (?tier=…);
 * - remembers the choice in a cookie, which src/proxy.ts reads when "/" is
 *   opened again. The URL stays the source of truth, so server HTML and
 *   hydration always agree.
 */
export function LanguageSwitcher({ current, label, names }: LanguageSwitcherProps) {
  const choose = (locale: Locale) => (event: MouseEvent<HTMLAnchorElement>) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${MAX_AGE}; samesite=lax`;
    if (locale === current) {
      event.preventDefault();
      return;
    }
    // Carry the chapter and query over, then let the browser follow the link.
    event.currentTarget.href = `${localeHome(locale)}${window.location.search}${window.location.hash}`;
  };

  return (
    <nav aria-label={label}>
      <ul className="flex items-center">
        {locales.map((locale, i) => {
          const active = locale === current;
          return (
            <li key={locale} className="flex items-center">
              {i > 0 && <span aria-hidden className="mx-2 h-3 w-px bg-ink-500" />}
              <a
                href={localeHome(locale)}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                onClick={choose(locale)}
                className={`inline-flex min-h-11 min-w-8 items-center justify-center text-eyebrow uppercase transition-colors duration-500 ease-cinematic hover:text-silver-50 ${
                  active ? "text-silver-50" : "text-silver-500"
                }`}
              >
                {/* Accessible name "EN English": it contains the visible label (WCAG 2.5.3). */}
                {locale.toUpperCase()}
                <span className="sr-only"> {names[locale]}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
