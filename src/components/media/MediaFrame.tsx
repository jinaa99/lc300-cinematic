import Image from "next/image";
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
  className?: string;
};

const showBrief = process.env.NODE_ENV !== "production";

/**
 * Renders the licensed image for a media slot, or — until one is supplied —
 * an explicit pending frame. The pending state is deliberately plain: it marks
 * where the photography goes rather than imitating it.
 */
export function MediaFrame({
  slot,
  fill = false,
  sizes = "100vw",
  preload = false,
  className,
}: MediaFrameProps) {
  const sizing = fill ? "absolute inset-0" : "relative w-full";
  const style = fill ? undefined : { aspectRatio: slot.aspect };

  if (slot.asset) {
    const { src, alt, focus } = slot.asset;
    return (
      <div className={cn(sizing, "overflow-hidden bg-ink-900", className)} style={style}>
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

  return (
    <div
      className={cn(sizing, "overflow-hidden bg-ink-900", className)}
      style={style}
      role="img"
      aria-label="Photography pending"
      data-media-slot={slot.id}
      data-media-state="pending"
    >
      <CornerMarks underHeader={fill} />
      <div
        className={cn(
          "absolute right-10 max-w-xs text-right md:right-14",
          // Full-bleed frames sit under the fixed header; clear it.
          fill ? "top-[calc(var(--spacing-header)+1.5rem)]" : "top-10 md:top-14",
        )}
      >
        <p className="text-eyebrow uppercase text-silver-500">
          Licensed photography pending · {slot.id}
        </p>
        {showBrief && (
          <p className="mt-3 hidden text-xs leading-relaxed text-silver-500 md:block">
            {slot.brief}
          </p>
        )}
      </div>
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
