"use client"; // Error boundaries must be Client Components.

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { defaultLocale, getCopy, hasLocale } from "@/content/copy";

/**
 * Fallback for a runtime error in the page (a client island throwing). The
 * root layout, header and footer stay in place. The 3D layer has its own
 * boundary (ExperienceRoot) and never reaches this one.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // A client boundary can't read next/root-params; the route params carry the locale.
  const { lang } = useParams<{ lang: string }>();
  const copy = getCopy(hasLocale(lang) ? lang : defaultLocale).error;
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" aria-labelledby="error-title" className="relative z-10 flex min-h-svh items-center bg-ink-950">
      <div className="frame pt-header">
        <Eyebrow rule>LC300</Eyebrow>
        <h1 id="error-title" className="mt-8 font-display text-display-md font-extralight uppercase text-metallic">
          {copy.title}
        </h1>
        <p className="mt-8 max-w-copy text-lede text-silver-300">{copy.body}</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-12 inline-flex items-center gap-4 border border-silver-500/40 px-8 py-4 text-eyebrow uppercase text-silver-100 transition-colors duration-500 ease-cinematic hover:border-silver-100 hover:text-silver-50"
        >
          <span aria-hidden className="h-px w-6 bg-signal" />
          {copy.retry}
        </button>
      </div>
    </main>
  );
}
