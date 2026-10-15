import type { Metadata, Viewport } from "next";
import { Inter_Tight, Unbounded } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCopy, localeHome, locales } from "@/content/copy";
import { getLocale } from "@/content/copy/server";
import { siteConfig, siteUrl } from "@/content/site";
import "../globals.css";

// Both families include Cyrillic for the Mongolian (mn) locale. Mongolian
// needs cyrillic-ext too: Ө ө Ү ү (U+04E8–04E9, U+04AE–04AF) are not in the
// basic cyrillic subset and would otherwise fall back to a system font.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["200", "300", "400"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

/** Every locale is prerendered (required by Cache Components for the root param). */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { meta } = getCopy(locale);
  return {
    metadataBase: siteUrl,
    title: { default: meta.title, template: `%s — ${siteConfig.name}` },
    description: meta.description,
    applicationName: siteConfig.name,
    alternates: {
      canonical: localeHome(locale),
      languages: { ...Object.fromEntries(locales.map((l) => [l, localeHome(l)])), "x-default": localeHome("en") },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: meta.title,
      description: meta.description,
      locale: meta.ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => getCopy(l).meta.ogLocale),
    },
    // Non-commercial concept (the 3D model is CC BY-NC-SA, see docs/ASSETS.md):
    // kept out of search indexes.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
};

/**
 * Root layout for both locales (/ is English, /mn Mongolian; see
 * src/proxy.ts). Pages render their own <main id="main">, so the 3D layer
 * can be mounted by the home page only.
 */
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${unbounded.variable} ${interTight.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink-800 focus:px-4 focus:py-3 focus:text-sm focus:text-silver-50"
        >
          {getCopy(locale).skipToContent}
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
