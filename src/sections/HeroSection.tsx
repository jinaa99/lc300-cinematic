import { MediaFrame } from "@/components/media/MediaFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { mediaSlots } from "@/content/media";

/**
 * Opening frame. Static by design: it must read well before any JS runs.
 * Scroll choreography will be layered on later from a client "scene" wrapper
 * (see docs/ARCHITECTURE.md) without changing this markup.
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden"
    >
      <MediaFrame slot={mediaSlots.heroExterior} fill preload sizes="100vw" className="-z-10" />

      {/* Legibility scrim for the title over photography */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-ink-950 via-ink-950/60 to-transparent"
      />

      <div className="frame pb-[clamp(3rem,8vh,6rem)]">
        <Eyebrow rule>Toyota Land Cruiser 300</Eyebrow>

        <h1
          id="hero-title"
          className="mt-8 font-display text-display-xl font-extralight uppercase text-metallic"
        >
          Land
          <br />
          Cruiser
        </h1>

        <div className="mt-10 flex items-end justify-between gap-10">
          <p className="max-w-copy text-lede text-silver-300">
            A cinematic study of the Land Cruiser 300, told for the roads, distances and seasons
            of Mongolia.
          </p>

          <div aria-hidden className="hidden shrink-0 flex-col items-center gap-4 md:flex">
            <span className="text-eyebrow uppercase text-silver-500 [writing-mode:vertical-rl]">
              Scroll
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
