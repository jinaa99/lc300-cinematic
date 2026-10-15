import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";

/** Wheels, off-road, Mongolian tracks. 3D chapter with the longest scroll. */
export function TerrainSection() {
  const copy = getCopy().terrain;
  return (
    <StickyChapter id="terrain" copy={copy} length={250}>
      <ul className="mt-12 grid max-w-copy grid-cols-1 gap-x-10 gap-y-4 border-t border-ink-700 pt-8 sm:grid-cols-2">
        {copy.notes.map((note) => (
          <li key={note} className="flex items-baseline gap-4 text-sm text-silver-400">
            <span aria-hidden className="h-px w-6 shrink-0 translate-y-[-0.25em] bg-silver-500" />
            {note}
          </li>
        ))}
      </ul>
    </StickyChapter>
  );
}
