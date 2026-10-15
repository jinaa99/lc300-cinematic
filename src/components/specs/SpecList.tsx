import type { Locale } from "@/content/copy";
import { cn } from "@/lib/cn";
import type { SpecVariant, Text, VehicleSpec } from "@/types/content";

/** Resolves a Text for a locale (plain strings read the same in every locale). */
export function text(value: Text, locale: Locale) {
  return typeof value === "string" ? value : value[locale];
}

function isVariants(value: VehicleSpec["value"]): value is readonly SpecVariant[] {
  return Array.isArray(value);
}

/**
 * Verified figures as a definition list. A value that differs by grade is
 * shown per grade, with the grades named; a qualifier from the source (test
 * method, how it was measured) follows the value.
 */
export function SpecList({
  specs,
  locale,
  className,
}: {
  specs: readonly VehicleSpec[];
  locale: Locale;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2", className)}>
      {specs.map((spec) => (
        <div key={spec.id} className="min-w-0">
          <dt className="text-xs text-silver-500">{spec.label[locale]}</dt>
          {!isVariants(spec.value) ? (
            <dd className="mt-1 text-base text-silver-100">{text(spec.value, locale)}</dd>
          ) : (
            spec.value.map((variant) => (
              <dd key={text(variant.grades, locale)} className="mt-1.5">
                <span className="block text-base text-silver-100">{text(variant.value, locale)}</span>
                <span className="block text-xs text-silver-500">{text(variant.grades, locale)}</span>
              </dd>
            ))
          )}
          {spec.note && <dd className="mt-1.5 text-xs text-silver-500 italic">{spec.note[locale]}</dd>}
        </div>
      ))}
    </dl>
  );
}
