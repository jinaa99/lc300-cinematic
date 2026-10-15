import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCopy, localeHome } from "@/content/copy";
import { getLocale } from "@/content/copy/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getCopy(await getLocale()).notFound.title };
}

/** 404 inside the root layout, in the site's own tokens instead of the default page. */
export default async function NotFound() {
  const locale = await getLocale();
  const copy = getCopy(locale).notFound;
  return (
    <main id="main" aria-labelledby="not-found-title" className="relative z-10 flex min-h-svh items-center bg-ink-950">
      <div className="frame pt-header">
        <Eyebrow rule>404</Eyebrow>
        <h1 id="not-found-title" className="mt-8 font-display text-display-md font-extralight uppercase text-metallic">
          {copy.title}
        </h1>
        <p className="mt-8 max-w-copy text-lede text-silver-300">{copy.body}</p>
        {/* Full load: a client navigation would keep this page mounted (hidden), with a second #main. */}
        <a
          href={localeHome(locale)}
          className="mt-12 inline-flex items-center gap-4 border border-silver-500/40 px-8 py-4 text-eyebrow uppercase text-silver-100 transition-colors duration-500 ease-cinematic hover:border-silver-100 hover:text-silver-50"
        >
          <span aria-hidden className="h-px w-6 bg-signal" />
          {copy.home}
        </a>
      </div>
    </main>
  );
}
