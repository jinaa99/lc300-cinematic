import { siteConfig } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-ink-700 bg-ink-950">
      <div className="frame flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-sm tracking-wide-display text-silver-300">LC300</p>
        <div className="max-w-copy space-y-3 text-xs leading-relaxed text-silver-500 md:text-right">
          <p>{siteConfig.disclaimer}</p>
          <ModelCredit />
        </div>
      </div>
    </footer>
  );
}

/** Attribution required by the 3D model's licence; hidden until the credit is complete. */
function ModelCredit() {
  const { title, author, url, license, licenseUrl, basedOn, changes } = siteConfig.modelCredit;
  if (!author || !url) return null;
  return (
    <p>
      3D model:{" "}
      <a href={url} className="underline underline-offset-2 hover:text-silver-300">
        “{title}”
      </a>{" "}
      by {author} ({basedOn}), licensed under{" "}
      <a href={licenseUrl} className="underline underline-offset-2 hover:text-silver-300">
        {license}
      </a>
      ; {changes}.
    </p>
  );
}
