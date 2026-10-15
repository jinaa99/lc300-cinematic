import Link from "next/link";
import { siteConfig } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="frame flex h-header items-center justify-between">
        <Link href="/" className="group flex items-baseline gap-3" aria-label={`${siteConfig.name} — home`}>
          <span className="font-display text-sm font-normal tracking-wide-display text-silver-100">
            LC300
          </span>
          <span className="text-eyebrow uppercase text-silver-500 transition-colors duration-500 ease-cinematic group-hover:text-silver-300">
            Cinematic
          </span>
        </Link>

        {siteConfig.nav.length > 0 && (
          <nav aria-label="Primary">
            <ul className="flex items-center gap-8">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-eyebrow uppercase text-silver-400 transition-colors duration-500 ease-cinematic hover:text-silver-50"
                  >
                    {item.label}
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
