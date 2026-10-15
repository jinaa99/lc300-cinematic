# Assets

The art direction depends on real, licensed media. Nothing below has been obtained yet.

## Licensing rules

- Every image needs a rights holder and usage terms (`ImageAsset.license`). Manufacturer press kits are usually limited to editorial use. Check their terms before using them in commercial or importer marketing.
- Don't use the Toyota logo or emblem artwork without written permission. The site name and copy refer to the vehicle descriptively.
- Stock or AI-generated renders of the vehicle are not a substitute for photography of the vehicle.

## Required

| Slot (`src/content/media.ts`) | Brief                                                                                     | Format                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------- |
| `heroExterior`                | Three-quarter front, low camera, dusk/overcast, dark open landscape, vehicle lower-right | ≥ 3840×2160 JPEG/TIFF master, 16:9 crop |

More slots will be added with each section: interior, detail macros, terrain/environment, a night exterior and an optional hero video loop.

## Optional (3D)

- A licensed, production-quality LC300 glTF/GLB with accurate materials (paint, glass, chrome) and separated wheels.
- An HDRI environment for realistic reflections.

## How to add an image

1. Place the file in `public/media/vehicle/` or `public/media/environment/`.
2. Fill the slot's `asset` in `src/content/media.ts` with `src`, `alt`, `width`, `height`, `license` and an optional `focus`.
3. `MediaFrame` switches from the pending frame to `next/image` automatically.

## Specifications

Add specifications to `src/content/vehicle.ts` only from official Toyota sources or importer homologation documents. Each one must record its market.
