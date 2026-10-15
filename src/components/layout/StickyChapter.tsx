import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ChapterCopy, ChapterId } from "@/content/copy";
import { cn } from "@/lib/cn";

type StickyChapterProps = {
  id: ChapterId;
  copy: ChapterCopy;
  /**
   * Scroll length of the chapter in viewport heights. The text stays pinned
   * while the page scrolls this distance (room for the 3D camera to move).
   */
  length: 150 | 200 | 250;
  /**
   * Opaque chapters cover the 3D layer (non-3D content). Transparent ones
   * let the canvas show through, with a scrim behind the text on the left.
   */
  opaque?: boolean;
  children?: ReactNode;
};

/**
 * A full-width chapter: tall scroll track, with eyebrow, title and body
 * pinned (position: sticky) in the left column. Server Component; complete
 * and readable without JavaScript.
 */
export function StickyChapter({ id, copy, length, opaque = false, children }: StickyChapterProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("relative isolate", opaque && "bg-ink-950")}
      style={{ minHeight: `${length}vh` }}
    >
      {/* Text sits at the bottom on phones (vehicle above it), centred on
          the left from md up (vehicle to the right). */}
      {/* items-center-safe: content taller than the viewport starts below the
          header instead of overflowing above it. */}
      <div className="sticky top-0 flex min-h-svh items-end md:items-center-safe">
        {!opaque && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-ink-950/95 via-ink-950/70 via-45% to-transparent to-75% md:bg-linear-to-r md:from-ink-950/85 md:via-ink-950/40 md:via-40% md:to-transparent md:to-65%"
          />
        )}
        <div className="frame w-full pt-[calc(var(--spacing-header)+2rem)] pb-16">
          <div className="max-w-copy">
            <Eyebrow rule>{copy.eyebrow}</Eyebrow>
            <h2 id={titleId} className="mt-8 font-display text-display-md font-extralight uppercase text-metallic">
              {copy.title}
            </h2>
            <p className="mt-8 text-lede text-silver-300">{copy.body}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
