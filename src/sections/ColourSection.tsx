import { ColourPicker } from "@/components/experience/ColourPicker";
import { TurntableControl } from "@/components/experience/TurntableControl";
import { StickyChapter } from "@/components/layout/StickyChapter";
import { getServerCopy } from "@/content/copy/server";

/** Paint finishes on a turntable. 3D chapter; client islands for the picker and the turntable. */
export async function ColourSection() {
  const copy = (await getServerCopy()).colour;
  return (
    <StickyChapter id="colour" copy={copy} length={200}>
      <ColourPicker
        label={copy.pickerLabel}
        names={copy.finishes}
        note={copy.note}
        loading={copy.loading}
        unavailable={copy.unavailable}
      />
      <TurntableControl
        label={copy.rotateLabel}
        hint={copy.rotateHint}
        touchHint={copy.rotateTouchHint}
        left={copy.rotateLeft}
        right={copy.rotateRight}
      />
    </StickyChapter>
  );
}
