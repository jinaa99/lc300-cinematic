import { en } from "./en";
import { mn } from "./mn";
import { type Locale, locales, type SiteCopy } from "./types";

export * from "./types";

/**
 * English is the default and is served without a prefix (/); Mongolian is
 * served at /mn. The locale lives in the URL, so server HTML always matches
 * the client (no hydration mismatch). src/proxy.ts maps the paths.
 */
export const defaultLocale: Locale = "en";

/** Cookie that remembers an explicit language choice (set by LanguageSwitcher, read by src/proxy.ts). */
export const LOCALE_COOKIE = "lc300-locale";

const copies: Record<Locale, SiteCopy> = { en, mn };

export function hasLocale(value: string | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}

export function getCopy(locale: Locale = defaultLocale): SiteCopy {
  return copies[locale];
}

/** Home path of a locale: "/" for the default, "/mn" otherwise. */
export function localeHome(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}
