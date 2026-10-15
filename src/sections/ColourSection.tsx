import { ColourPicker } from "@/components/experience/ColourPicker";
import { TurntableControl } from "@/components/experience/TurntableControl";
import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";

/** Paint finishes on a turntable. 3D chapter; client islands for the picker and the turntable. */
export function ColourSection() {
  const copy = getCopy().colour;
  return (
    <StickyChapter id="colour" copy={copy} length={200}>
      <ColourPicker label={copy.pickerLabel} names={copy.finishes} note={copy.note} unavailable={copy.unavailable} />
      <TurntableControl label={copy.rotateLabel} hint={copy.rotateHint} />
    </StickyChapter>
  );
}
