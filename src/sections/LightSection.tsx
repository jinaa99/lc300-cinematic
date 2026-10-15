import { StickyChapter } from "@/components/layout/StickyChapter";
import { getServerCopy } from "@/content/copy/server";

/** Lamps and low light. 3D chapter. */
export async function LightSection() {
  return <StickyChapter id="light" copy={(await getServerCopy()).light} length={150} />;
}
