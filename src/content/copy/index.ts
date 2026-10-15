import { en } from "./en";
import { mn } from "./mn";
import type { Locale, SiteCopy } from "./types";

export * from "./types";

/** The locale the site renders today. Switching to `mn` is a routing change. */
export const defaultLocale: Locale = "en";

const copies: Record<Locale, SiteCopy> = { en, mn };

export function getCopy(locale: Locale = defaultLocale): SiteCopy {
  return copies[locale];
}
