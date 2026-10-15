import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import type { MediaSlot } from "@/types/content";
import { cn } from "@/lib/cn";

type MediaFrameProps = {
  slot: MediaSlot;
  /** Fill the positioned parent instead of sizing by the slot's aspect ratio. */
  fill?: boolean;
  /** Responsive `sizes` hint for next/image. */
  sizes?: string;
  /** Preload above-the-fold imagery (the hero). */
  preload?: boolean;
  /**
   * Marks this frame as the poster of a 3D chapter: it fades out once the
   * experience layer is live (globals.css) and back in if it fails.
   */
  poster?: boolean;
  className?: string;
};

/** Matches the stacked (phone) layout the portrait crop was rendered for. */
const PORTRAIT_MEDIA = "(max-width: 767px) and (orientation: portrait)";

/** Development builds label the empty slot with its id and brief. */
const labelPending = process.env.NODE_ENV !== "production";

/**
 * Renders the licensed image for a media slot, or — until one is supplied —
 * a pending frame. The pending state never imitates the missing media: in
 * development it is labelled (slot id and brief); in production it is a
 * plain, decorative studio tone, so visitors don't see build notes.
 */
export function MediaFrame({
  slot,
  fill = false,
  sizes = "100vw",
  preload = false,
  poster = false,
  className,
}: MediaFrameProps) {
  const sizing = fill ? "absolute inset-0" : "relative w-full";
  const style = fill ? undefined : { aspectRatio: slot.aspect };
  const role = poster ? "poster" : undefined;

  if (slot.asset?.portrait) {
    // Art direction: phones in portrait get their own crop. One <picture>,
    // so the browser downloads only the source it picks.
    const { src, alt, width, height, focus, portrait } = slot.asset;
    const common = {
      alt,
      sizes,
      loading: preload ? "eager" : "lazy",
      fetchPriority: preload ? "high" : undefined,
    } as const;
    const {
      props: { srcSet: portraitSrcSet },
    } = getImageProps({ ...common, src: portrait.src, width: portrait.width, height: portrait.height });
    // Its inline style (if any) is replaced by the focus variable below.
    const { props: img } = getImageProps({ ...common, src, width, height });
    return (
      <div className={cn(sizing, "overflow-hidden bg-ink-950", className)} style={style} data-media-role={role}>
        <picture>
          <source media={PORTRAIT_MEDIA} srcSet={portraitSrcSet} />
          <img
            {...img}
            alt={alt}
            // The focus point applies to the landscape image; the portrait
            // crop is framed for phones and stays centred.
            className="absolute inset-0 size-full object-cover [object-position:var(--focus)] max-md:portrait:object-center"
            style={{ "--focus": focus ?? "50% 50%" } as CSSProperties}
          />
        </picture>
      </div>
    );
  }

  if (slot.asset) {
    const { src, alt, focus } = slot.asset;
    return (
      <div className={cn(sizing, "overflow-hidden bg-ink-900", className)} style={style} data-media-role={role}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
          style={focus ? { objectPosition: focus } : undefined}
        />
      </div>
    );
  }

  // Decorative: there is no image, so nothing is announced to assistive tech.
  return (
    <div
      aria-hidden
      className={cn(
        sizing,
        "overflow-hidden bg-ink-950 bg-[radial-gradient(ellipse_70%_45%_at_68%_78%,var(--color-ink-700),transparent)]",
        className,
      )}
      style={style}
      data-media-slot={slot.id}
      data-media-state="pending"
      data-media-role={role}
    >
      {labelPending && (
        <>
          <CornerMarks underHeader={fill} />
          <div
            className={cn(
              "absolute right-10 max-w-xs text-right md:right-14",
              // Full-bleed frames sit under the fixed header; clear it.
              fill ? "top-[calc(var(--spacing-header)+1.5rem)]" : "top-10 md:top-14",
            )}
          >
            <p className="text-eyebrow uppercase text-silver-500">Media pending · {slot.id}</p>
            <p className="mt-3 hidden text-xs leading-relaxed text-silver-500 md:block">{slot.brief}</p>
          </div>
        </>
      )}
    </div>
  );
}

function CornerMarks({ underHeader }: { underHeader: boolean }) {
  const mark = "absolute size-5 border-silver-500/40";
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-x-6 bottom-6 md:inset-x-10 md:bottom-10",
        underHeader ? "top-header" : "top-6 md:top-10",
      )}
    >
      <span className={cn(mark, "left-0 top-0 border-l border-t")} />
      <span className={cn(mark, "right-0 top-0 border-r border-t")} />
      <span className={cn(mark, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(mark, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}
