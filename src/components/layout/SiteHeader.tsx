import Link from "next/link";
import { getCopy } from "@/content/copy";
import { siteConfig } from "@/content/site";

export function SiteHeader() {
  const copy = getCopy();
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Keeps the mark and nav legible over bright frames (steppe sky) and
          over chapter text scrolling up underneath. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--spacing-header)+2.5rem)] bg-linear-to-b from-ink-950/90 via-ink-950/60 to-transparent"
      />
      <div className="frame flex h-header items-center justify-between">
        {/* No aria-label: the visible "LC300 Cinematic" is the link's name
            (WCAG 2.5.3, label in name). */}
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-display text-sm font-normal tracking-wide-display text-silver-100">
            LC300
          </span>{" "}
          <span className="text-eyebrow uppercase text-silver-500 transition-colors duration-500 ease-cinematic group-hover:text-silver-300">
            Cinematic
          </span>
        </Link>

        {siteConfig.nav.length > 0 && (
          // Hidden on small screens: seven anchors don't fit, and the page reads
          // top to bottom without them.
          <nav aria-label={copy.nav.label} className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {siteConfig.nav.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="text-eyebrow uppercase text-silver-400 transition-colors duration-500 ease-cinematic hover:text-silver-50"
                  >
                    {copy.nav.items[item.id]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
