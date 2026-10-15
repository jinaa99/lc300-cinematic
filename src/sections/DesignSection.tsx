import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";

/** Exterior design. 3D chapter: the canvas shows through. */
export function DesignSection() {
  return <StickyChapter id="design" copy={getCopy().design} length={200} />;
}
