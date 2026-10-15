import { siteConfig } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-700">
      <div className="frame flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-sm tracking-wide-display text-silver-300">LC300</p>
        <p className="max-w-copy text-xs leading-relaxed text-silver-500 md:text-right">
          {siteConfig.disclaimer}
        </p>
      </div>
    </footer>
  );
}
