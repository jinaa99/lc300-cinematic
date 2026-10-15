import type { Metadata, Viewport } from "next";
import { Inter_Tight, Unbounded } from "next/font/google";
import { ExperienceRoot } from "@/components/experience/ExperienceRoot";
import { defaultLocale, getCopy } from "@/content/copy";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig, siteUrl } from "@/content/site";
import "./globals.css";

// Both families include Cyrillic so a Mongolian (mn) locale can be added
// without changing typefaces.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["200", "300", "400"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: "en",
  },
  // Concept build: keep it out of search indexes while it is a portfolio concept with
  // licensed assets are in place.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} className={`${unbounded.variable} ${interTight.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink-800 focus:px-4 focus:py-3 focus:text-sm focus:text-silver-50"
        >
          {getCopy().skipToContent}
        </a>
        {/* Fixed 3D layer behind the page; renders nothing without JS or on the static tier. */}
        <ExperienceRoot />
        <SiteHeader />
        <main id="main" className="relative z-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
