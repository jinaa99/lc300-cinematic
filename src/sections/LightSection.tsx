import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";

/** Lamps and low light. 3D chapter. */
export function LightSection() {
  return <StickyChapter id="light" copy={getCopy().light} length={150} />;
}
