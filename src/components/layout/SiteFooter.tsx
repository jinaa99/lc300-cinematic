import type { SiteCopy } from "@/content/copy";
import { getServerCopy } from "@/content/copy/server";
import { siteConfig } from "@/content/site";

export async function SiteFooter() {
  const copy = (await getServerCopy()).footer;
  return (
    <footer className="relative z-10 border-t border-ink-700 bg-ink-950">
      <div className="frame flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-sm tracking-wide-display text-silver-300">LC300</p>
        <div className="max-w-copy space-y-3 text-xs leading-relaxed text-silver-500 md:text-right">
          <p className="text-silver-300">{copy.concept}</p>
          <p>{copy.disclaimer}</p>
          <ModelCredit copy={copy} />
        </div>
      </div>
    </footer>
  );
}

/** Attribution required by the 3D model's licence; hidden until the credit is complete. */
function ModelCredit({ copy }: { copy: SiteCopy["footer"] }) {
  const { title, author, url, license, licenseUrl, noticeUrl } = siteConfig.modelCredit;
  if (!author || !url) return null;
  const link = "underline underline-offset-2 hover:text-silver-300";
  return (
    <p>
      {copy.modelLabel}{" "}
      {/* The model's title is English in every locale. */}
      <a href={url} className={link} rel="noreferrer" lang="en">
        “{title}”
      </a>{" "}
      {copy.by} {author} ({copy.basedOn}), {copy.licensedUnder}{" "}
      <a href={licenseUrl} className={link} rel="license noreferrer">
        {license}
      </a>
      ; {copy.changes}.{" "}
      <a href={noticeUrl} className={link} hrefLang="en">
        {copy.licenseFile}
      </a>
    </p>
  );
}
