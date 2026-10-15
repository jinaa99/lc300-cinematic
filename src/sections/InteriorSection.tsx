import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";

/** The cabin. 3D chapter. */
export function InteriorSection() {
  return <StickyChapter id="interior" copy={getCopy().interior} length={200} />;
}
