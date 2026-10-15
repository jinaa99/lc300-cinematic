import { type NextRequest, NextResponse } from "next/server";

// Constants are inlined: Proxy runs separately from the app and shouldn't
// rely on shared modules (see the proxy docs). Keep in sync with
// src/content/copy (locales, defaultLocale, LOCALE_COOKIE).
const DEFAULT = "en";
const OTHERS = ["mn"];
const COOKIE = "lc300-locale";

/**
 * Locale routing. Every page lives under app/[lang]:
 * - English, the default, is served without a prefix: "/" is rewritten to
 *   "/en", and "/en/…" redirects to the unprefixed URL, so each page has
 *   one address.
 * - "/mn/…" is served as is.
 * - "/" redirects to "/mn" only if the visitor chose Mongolian with the
 *   switcher (cookie). Nothing is guessed from Accept-Language: English
 *   stays the default.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (OTHERS.includes(first)) return NextResponse.next();

  if (first === DEFAULT) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  const chosen = request.cookies.get(COOKIE)?.value;
  if (pathname === "/" && chosen && OTHERS.includes(chosen)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${chosen}`;
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: skip Next internals and anything with a file extension
  // (models, decoders, HDRIs, the licence file, icons).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
