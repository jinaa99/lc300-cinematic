import { MediaFrame } from "@/components/media/MediaFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getServerCopy } from "@/content/copy/server";
import { mediaSlots } from "@/content/media";

/**
 * Opening frame. Static by design: it must read well before any JS runs.
 * The 3D layer behind it (ExperienceRoot) takes over from the poster once
 * live, without changing this markup (see docs/ARCHITECTURE.md).
 */
export async function HeroSection() {
  const copy = (await getServerCopy()).hero;
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden"
    >
      {/* Poster for the 3D hero; fades out when the experience layer is live. */}
      <MediaFrame slot={mediaSlots.heroExterior} fill preload poster sizes="100vw" className="-z-10" />

      {/* Legibility scrim behind the title only (lower left). The vehicle sits
          lower right, so the scrim fades out before it and the canvas shows
          clean. A short base fade blends into the next chapter. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-ink-950/95 via-ink-950/60 via-40% to-transparent to-70% md:bg-linear-to-tr md:from-ink-950/80 md:via-ink-950/15 md:via-35% md:to-transparent md:to-55%"
      />

      <div className="frame pb-[clamp(3rem,8vh,6rem)]">
        <Eyebrow rule>{copy.eyebrow}</Eyebrow>

        <h1
          id="hero-title"
          className="mt-8 font-display text-display-xl font-extralight uppercase text-metallic"
        >
          {copy.titleLines.map((line, i) => (
            <span key={line} className="block">
              {line}
              {i < copy.titleLines.length - 1 && <span className="sr-only"> </span>}
            </span>
          ))}
        </h1>

        <div className="mt-10 flex items-end justify-between gap-10">
          <div className="max-w-copy">
            <p className="text-lede text-silver-300">{copy.lede}</p>
            {/* The model is CC BY-NC-SA: the concept status is stated above the fold, not only in the footer. */}
            <p className="mt-6 text-eyebrow leading-normal uppercase text-silver-500">{copy.concept}</p>
          </div>

          <div aria-hidden className="hidden shrink-0 flex-col items-center gap-4 md:flex">
            <span className="text-eyebrow uppercase text-silver-500 [writing-mode:vertical-rl]">
              {copy.scrollCue}
            </span>
            <span className="block h-16 w-px overflow-hidden bg-ink-600">
              <span className="block h-full w-full animate-cue bg-silver-300" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
