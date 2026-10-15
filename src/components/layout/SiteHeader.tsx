import { getCopy, localeHome } from "@/content/copy";
import { getLocale } from "@/content/copy/server";
import { siteConfig } from "@/content/site";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";

export async function SiteHeader() {
  const locale = await getLocale();
  const copy = getCopy(locale);
  const home = localeHome(locale);
  // Through the locale's home, so the chapters are reachable from the 404
  // page too; on the home page itself it's an in-page jump.
  const items = siteConfig.nav.map((item) => ({ href: `${home}${item.href}`, label: copy.nav.items[item.id] }));

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Keeps the mark and nav legible over bright frames (steppe sky) and
          over chapter text scrolling up underneath. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--spacing-header)+3rem)] bg-linear-to-b from-ink-950 from-30% via-ink-950/75 via-60% to-transparent"
      />
      <div className="frame flex h-header items-center justify-between gap-6">
        {/* No aria-label: the visible "LC300 Cinematic" is the link's name
            (WCAG 2.5.3, label in name). A plain link, not next/link: a client
            navigation would keep the previous page mounted (hidden), with
            duplicate ids such as #main. */}
        <a href={home} className="group flex items-baseline gap-3">
          <span className="font-display text-sm font-normal tracking-wide-display text-silver-100">
            LC300
          </span>{" "}
          <span className="text-eyebrow uppercase text-silver-500 transition-colors duration-500 ease-cinematic group-hover:text-silver-300">
            Cinematic
          </span>
        </a>

        <div className="flex items-center gap-6 xl:gap-8">
          {items.length > 0 && (
            <nav aria-label={copy.nav.label} className="hidden xl:block">
              <ul className="flex items-center gap-6">
                {items.map((item) => (
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
          <LanguageSwitcher current={locale} label={copy.language.label} names={copy.language.names} />
          {items.length > 0 && (
            // Below xl, eight anchors don't fit inline: MobileNav shows them in a menu.
            <MobileNav label={copy.nav.label} openLabel={copy.nav.open} closeLabel={copy.nav.close} items={items} />
          )}
        </div>
      </div>
    </header>
  );
}
