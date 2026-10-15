import { StickyChapter } from "@/components/layout/StickyChapter";
import { SpecList } from "@/components/specs/SpecList";
import { getCopy } from "@/content/copy";
import { getLocale } from "@/content/copy/server";
import { headlineSpecs } from "@/content/vehicle";
import type { SourceReference } from "@/types/content";

/**
 * Headline figures over the night shot from behind, read only from
 * vehicle.ts. Every figure is shown under its market and edition, with its
 * source. The full list is in the vehicle information section.
 */
export async function PerformanceSection() {
  const locale = await getLocale();
  const { performance: copy, vehicle } = getCopy(locale);
  const sources = [...new Map(headlineSpecs.map((s) => [s.source.url, s.source])).values()];
  const scope = (source: SourceReference) =>
    vehicle.scope(vehicle.markets[source.market], vehicle.edition(source.edition));

  return (
    <StickyChapter id="performance" copy={copy} length={150}>
      {/* Left of the vehicle (which sits right in this shot). */}
      <div className="mt-8 max-w-[52rem] border-t border-ink-700 pt-6">
        {sources.map((source) => (
          <h3 key={source.url} className="text-eyebrow leading-normal uppercase text-silver-400">
            {scope(source)}
          </h3>
        ))}
        <SpecList specs={headlineSpecs} locale={locale} className="mt-5 gap-y-4" />
        <ul className="mt-6 space-y-1 text-xs text-silver-500">
          {sources.map((source) => (
            <li key={source.url}>
              {copy.sourceLabel}:{" "}
              <a href={source.url} className="underline underline-offset-2 hover:text-silver-300" rel="noreferrer">
                {source.title}
              </a>{" "}
              · {copy.checkedLabel} {source.retrievedAt}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 max-w-[52rem] text-xs text-silver-500">{copy.modelNote}</p>
      {copy.missing.length > 0 && (
        <p className="mt-3 text-xs text-silver-500">
          {copy.missingNote} {copy.missing.join(", ")}.
        </p>
      )}
      <a
        href="#specifications"
        className="mt-6 inline-flex items-center gap-4 text-eyebrow uppercase text-silver-300 transition-colors duration-500 ease-cinematic hover:text-silver-50"
      >
        <span aria-hidden className="h-px w-6 bg-signal" />
        {copy.fullSpecs}
      </a>
    </StickyChapter>
  );
}
