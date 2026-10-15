import { StickyChapter } from "@/components/layout/StickyChapter";
import { getServerCopy } from "@/content/copy/server";

/** The cabin. 3D chapter. */
export async function InteriorSection() {
  return <StickyChapter id="interior" copy={(await getServerCopy()).interior} length={200} />;
}
