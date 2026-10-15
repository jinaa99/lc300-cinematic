import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";
import { vehicleSpecs } from "@/content/vehicle";
import type { SourceReference, VehicleSpec } from "@/types/content";

/** Groups specs by market, keeping first-seen order. */
function byMarket(specs: readonly VehicleSpec[]) {
  const groups = new Map<string, VehicleSpec[]>();
  for (const spec of specs) {
    const list = groups.get(spec.source.market) ?? [];
    list.push(spec);
    groups.set(spec.source.market, list);
  }
  return [...groups];
}

function uniqueSources(specs: readonly VehicleSpec[]): SourceReference[] {
  return [...new Map(specs.map((s) => [s.source.url, s.source])).values()];
}

/**
 * Specifications, read only from vehicleSpecs. Every figure is shown under
 * its market with the source it came from. Over the night shot from behind.
 */
export function PerformanceSection() {
  const copy = getCopy().performance;
  return (
    <StickyChapter id="performance" copy={copy} length={150}>
      {vehicleSpecs.length === 0 ? (
        <p className="mt-12 max-w-copy border-t border-ink-700 pt-8 text-sm text-silver-500">{copy.pending}</p>
      ) : (
        byMarket(vehicleSpecs).map(([market, specs]) => (
          // Left of the vehicle (which sits right in this shot).
          <div key={market} className="mt-8 max-w-[52rem] border-t border-ink-700 pt-6">
            <h3 className="text-eyebrow uppercase text-silver-400">{copy.marketHeading(market)}</h3>
            <dl className="mt-5 grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
              {specs.map((spec) => (
                <div key={spec.id}>
                  <dt className="text-xs text-silver-500">{copy.labels[spec.id] ?? spec.label}</dt>
                  <dd className="mt-1 text-base text-silver-100">
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : null}
                  </dd>
                  {spec.grade && <dd className="mt-1 text-xs text-silver-500">{spec.grade}</dd>}
                </div>
              ))}
            </dl>
            <ul className="mt-6 space-y-1 text-xs text-silver-500">
              {uniqueSources(specs).map((source) => (
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
        ))
      )}
      {copy.missing.length > 0 && (
        <p className="mt-3 text-xs text-silver-500">
          {copy.missingNote} {copy.missing.join(", ")}.
        </p>
      )}
    </StickyChapter>
  );
}
