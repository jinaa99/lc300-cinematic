import { StickyChapter } from "@/components/layout/StickyChapter";
import { getServerCopy } from "@/content/copy/server";

/** Exterior design. 3D chapter: the canvas shows through. */
export async function DesignSection() {
  return <StickyChapter id="design" copy={(await getServerCopy()).design} length={200} />;
}
