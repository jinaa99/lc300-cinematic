import type { ReactNode } from "react";
import { SpecList, text } from "@/components/specs/SpecList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCopy, type Locale, type SiteCopy, type VehicleGroupId, vehicleGroupIds } from "@/content/copy";
import { getLocale } from "@/content/copy/server";
import { allSources, featureGroups, japanGrades, specGroups, toyotaJapan2025 } from "@/content/vehicle";
import type { SourceReference, VehicleFeature } from "@/types/content";

type VehicleCopy = SiteCopy["vehicle"];

/**
 * Vehicle information: the appendix after the film (the canvas has faded
 * to ink by here, so this section is opaque and outside the shot list).
 *
 * Two parts, kept visibly apart: a short editorial introduction (copy), then
 * the verified part, where every figure and piece of equipment comes from
 * src/content/vehicle.ts and each block names its market and edition.
 */
export async function VehicleInfoSection() {
  const locale = await getLocale();
  const copy = getCopy(locale).vehicle;
  const scope = (source: SourceReference) => copy.scope(copy.markets[source.market], copy.edition(source.edition));

  const body: Record<VehicleGroupId, ReactNode> = {
    engine: <SpecList specs={specGroups.engine} locale={locale} />,
    dimensions: <SpecList specs={specGroups.dimensions} locale={locale} />,
    interior: (
      <>
        <SpecList specs={specGroups.interior} locale={locale} />
        <FeatureList features={featureGroups.interior} locale={locale} copy={copy} />
      </>
    ),
    safety: <FeatureList features={featureGroups.safety} locale={locale} copy={copy} />,
    offroad: (
      <>
        <SpecList specs={specGroups.offroad} locale={locale} />
        <FeatureList features={featureGroups.offroad} locale={locale} copy={copy} />
      </>
    ),
    variants: <Variants locale={locale} copy={copy} />,
    sources: <Sources copy={copy} />,
  };
  // Blocks of figures carry their market and edition; the editorial ones don't.
  const scoped: Partial<Record<VehicleGroupId, SourceReference>> = {
    engine: toyotaJapan2025,
    dimensions: toyotaJapan2025,
    interior: toyotaJapan2025,
    safety: toyotaJapan2025,
    offroad: toyotaJapan2025,
  };

  return (
    <section id="specifications" aria-labelledby="specifications-title" className="relative isolate bg-ink-950">
      <div className="frame pt-[calc(var(--spacing-header)+4rem)] pb-section">
        <div className="max-w-copy">
          <Eyebrow rule>{copy.eyebrow}</Eyebrow>
          <h2 id="specifications-title" className="mt-8 font-display text-display-md font-extralight uppercase text-metallic">
            {copy.title}
          </h2>
          <p className="mt-8 text-lede text-silver-300">{copy.body}</p>
        </div>

        {/* Editorial: no figures. */}
        <div className="mt-16 grid gap-6 border-t border-ink-700 pt-8 lg:grid-cols-12">
          <p className="text-eyebrow leading-normal uppercase text-silver-400 lg:col-span-4">{copy.editorialLabel}</p>
          <div className="max-w-copy space-y-5 text-base leading-relaxed text-silver-300 lg:col-span-8">
            {copy.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Verified: everything below comes from vehicle.ts, with its source. */}
        <div className="mt-16 grid gap-6 border-t border-silver-500/40 pt-8 lg:grid-cols-12">
          <p className="flex items-center gap-4 text-eyebrow leading-normal uppercase text-silver-100 lg:col-span-4">
            <span aria-hidden className="h-px w-6 shrink-0 bg-signal" />
            {copy.verifiedLabel}
          </p>
          <div className="lg:col-span-8">
            <p className="max-w-copy text-sm leading-relaxed text-silver-400">{copy.verifiedNote}</p>
            <nav aria-label={copy.verifiedLabel} className="mt-8">
              <ol className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                {vehicleGroupIds.map((id, i) => (
                  <li key={id}>
                    <a
                      href={`#spec-${id}`}
                      className="flex gap-4 border-b border-ink-800 py-3 text-sm text-silver-300 transition-colors duration-500 ease-cinematic hover:text-silver-50"
                    >
                      <span aria-hidden className="tabular-nums text-silver-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {copy.groups[id].title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        {vehicleGroupIds.map((id) => {
          const source = scoped[id];
          return (
            <section
              key={id}
              id={`spec-${id}`}
              aria-labelledby={`spec-${id}-title`}
              className="mt-16 grid scroll-mt-[calc(var(--spacing-header)+1rem)] gap-6 border-t border-ink-700 pt-8 lg:grid-cols-12"
            >
              <div className="lg:col-span-4">
                <h3 id={`spec-${id}-title`} className="font-display text-xl font-light uppercase text-silver-100">
                  {copy.groups[id].title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-silver-400">{copy.groups[id].intro}</p>
                {source && <p className="mt-3 text-eyebrow leading-normal uppercase text-silver-500">{scope(source)}</p>}
              </div>
              <div className="min-w-0 space-y-10 lg:col-span-8">{body[id]}</div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function FeatureList({ features, locale, copy }: { features: readonly VehicleFeature[]; locale: Locale; copy: VehicleCopy }) {
  return (
    <div>
      <ul className="divide-y divide-ink-800 border-y border-ink-800">
        {features.map((feature) => (
          <li key={feature.id} className="grid gap-2 py-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-8">
            <div>
              <p className="text-sm text-silver-100">{feature.label[locale]}</p>
              {feature.note && <p className="mt-1 text-xs text-silver-500 italic">{feature.note[locale]}</p>}
            </div>
            <ul className="space-y-1 text-xs text-silver-400">
              {feature.availability.map((entry) => (
                <li key={`${entry.status}-${text(entry.grades, locale)}`}>
                  <span className={entry.status === "standard" ? "text-silver-200" : "text-silver-300"}>
                    {copy.availability[entry.status]}
                  </span>
                  {" · "}
                  {text(entry.grades, locale)}
                  {entry.detail && ` (${text(entry.detail, locale)})`}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-silver-500">{copy.equipmentNote}</p>
    </div>
  );
}

function Variants({ locale, copy }: { locale: Locale; copy: VehicleCopy }) {
  const scope = copy.scope(copy.markets[toyotaJapan2025.market], copy.edition(toyotaJapan2025.edition));
  return (
    <>
      <div
        role="region"
        aria-labelledby="grade-table-caption"
        // Scrollable by keyboard on narrow screens.
        tabIndex={0}
        className="overflow-x-auto"
      >
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <caption id="grade-table-caption" className="pb-4 text-left text-eyebrow leading-normal uppercase text-silver-400">
            {copy.gradeTable.caption} · {scope}
          </caption>
          <thead>
            <tr className="border-b border-ink-700 text-xs text-silver-500">
              <th scope="col" className="py-2 pr-6 font-normal">{copy.gradeTable.grade}</th>
              <th scope="col" className="py-2 pr-6 font-normal">{copy.gradeTable.engine}</th>
              <th scope="col" className="py-2 pr-6 font-normal">{copy.gradeTable.seats}</th>
              <th scope="col" className="py-2 font-normal">{copy.gradeTable.modelCode}</th>
            </tr>
          </thead>
          <tbody className="text-silver-200">
            {japanGrades.map((row) => (
              <tr key={row.modelCode} className="border-b border-ink-800">
                <th scope="row" className="py-3 pr-6 font-normal text-silver-100">{row.grade}</th>
                <td className="py-3 pr-6">{row.engine[locale]}</td>
                <td className="py-3 pr-6 tabular-nums">{row.seats}</td>
                <td className="py-3 font-mono text-xs text-silver-400">{row.modelCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="max-w-copy space-y-4 text-sm leading-relaxed text-silver-300">
        {copy.differences.map((line) => (
          <li key={line} className="flex gap-4">
            <span aria-hidden className="mt-[0.7em] h-px w-6 shrink-0 bg-silver-500" />
            {line}
          </li>
        ))}
      </ul>
      <div className="max-w-copy border-l border-signal/60 pl-5">
        <h4 className="text-eyebrow leading-normal uppercase text-silver-300">{copy.notSourcedTitle}</h4>
        <ul className="mt-3 space-y-1 text-sm text-silver-400">
          {copy.notSourced.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Sources({ copy }: { copy: VehicleCopy }) {
  return (
    <>
      {allSources.map((source) => (
        <dl key={source.url} className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-xs text-silver-500">{copy.sourceFields.document}</dt>
          <dd className="text-silver-200">
            <a href={source.url} className="break-words underline underline-offset-2 hover:text-silver-50" rel="noreferrer">
              {source.title}
            </a>
          </dd>
          <dt className="text-xs text-silver-500">{copy.sourceFields.market}</dt>
          <dd className="text-silver-200">{copy.markets[source.market]}</dd>
          <dt className="text-xs text-silver-500">{copy.sourceFields.edition}</dt>
          <dd className="text-silver-200">{copy.edition(source.edition)}</dd>
          <dt className="text-xs text-silver-500">{copy.sourceFields.checked}</dt>
          <dd className="tabular-nums text-silver-200">{source.retrievedAt}</dd>
        </dl>
      ))}
      <p className="max-w-copy text-xs text-silver-500">{copy.pricesNote}</p>
    </>
  );
}
