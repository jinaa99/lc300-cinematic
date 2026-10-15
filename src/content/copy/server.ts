import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { getCopy, hasLocale } from ".";
import type { Locale, SiteCopy } from "./types";

/**
 * The active locale, from the [lang] root segment. Server Components only
 * (next/root-params fails the build in a Client Component); client islands
 * receive their strings as props.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

/** Copy for the active locale. */
export async function getServerCopy(): Promise<SiteCopy> {
  return getCopy(await getLocale());
}
