# Assets

The art direction depends on real, licensed media. Status:

| Asset                       | Status                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| LC300 3D model (FBX + PBR)  | Converted to `public/models/lc300.glb`. Licence **CC BY-NC-SA 4.0**: non-commercial only. Upstream origin is uncertain (see "3D model"). |
| HDRI environment            | Poly Haven "Studio Small 09" and "Belfast Sunset", CC0, in `public/models/env/`        |
| Hero posters (renders)      | `public/media/renders/hero-exterior-16x9.webp` (3840×2160) and `hero-exterior-portrait.webp` (860×1864), rendered from the model at the hero key. **CC BY-NC-SA 4.0** adaptations, non-commercial only. |
| Photography                 | Not obtained                                                                             |

## Licensing rules

- Every image needs a rights holder and usage terms (`ImageAsset.license`). Manufacturer press kits are usually limited to editorial use. Check their terms before using them.
- Stock or AI-generated renders of the vehicle are not a substitute for photography of the vehicle. The one exception is **rendered posters**: stills rendered from the project's own licensed 3D model, used as the static stand-in for a 3D chapter (see below).

### Badges and the Toyota logo

Two cases are treated differently:

- **Badges on the vehicle model.** The emblems and lettering on the car (front emblem, rear emblem, "LAND CRUISER", grade and engine badges, wheel centre caps) are part of an accurate depiction of the product. They are kept in the model as separate nodes and shown by default. `siteConfig.showBadges` in `src/content/site.ts` switches them off.
- **Site branding.** The Toyota logo or emblem is never used as this site's own brand: not in the header, favicon, Open Graph images, footer or any UI. The site name and copy refer to the vehicle descriptively.

Logos that are painted into texture atlases cannot be toggled. These are the steering-wheel hub and the instrument-cluster screen, in `T_Dashboard_D`/`_E`.

### Before going public

The site is a **non-commercial portfolio concept**. That is the use the model's licence (CC BY-NC-SA) allows.

- [ ] No commercial framing: no dealer or importer branding, prices, lead forms or client-paid hosting. If that changes, a commercial model licence (or another model) is needed first.
- [ ] `showBadges`: keep badges on the vehicle, or show it de-badged.
- [ ] Toyota trademark use in copy and the footer disclaimer wording.
- [x] Model credit complete (`siteConfig.modelCredit`, `public/models/lc300.LICENSE.txt`).
- [x] Upstream (Racing Master game asset) risk accepted for the portfolio (2026-10-15). Revisit before any wider promotion.
- [x] "RACING MASTER" sidewall lettering removed (pipeline texture edit, see below).
- [ ] Market and grade represented: the model is a VX.R, a Middle East grade. Copy must not imply it is the spec sold in Mongolia.
- [ ] Public Git repository: CC BY-NC-SA allows redistributing the GLB, as long as `lc300.LICENSE.txt` travels with it and the credit is complete. The credit is complete, so pushing is fine once the upstream risk is accepted.

## Commercial use: affected files and migration path

The model is licensed for non-commercial use only. The site is labelled as a non-commercial concept in the hero (`hero.concept`), the footer (`footer.concept`, the model credit and a link to `lc300.LICENSE.txt`) and the metadata description. Keep those labels until the model is replaced or commercially licensed.

These files carry or depend on the CC BY-NC-SA model:

| File | Role |
| --- | --- |
| `public/models/lc300.glb` | The adapted model (CC BY-NC-SA 4.0). |
| `public/models/lc300.LICENSE.txt` | Attribution and licence notice. It must travel with the GLB. |
| `assets-src/lc300/` (git-ignored) | Source FBX, textures and pipeline output. |
| `scripts/model/config.mjs`, `edits.mjs`, `convert.mjs` | Source-specific rules: texture binding, badge islands, wheel nodes, the sidewall edit. |
| `src/content/site.ts` (`modelCredit`) | The credit shown in the footer. |
| `src/components/three/Lc300.tsx`, `materials.ts`, `controllers/vehicle.ts` | Depend on the node and material names in the "Model contract" (docs/ARCHITECTURE.md). |
| `src/content/cameraShots.ts`, `scripts/check-camera-path.mjs` | Camera keys and the clearance check are fitted to this model's geometry, including the cabin path. |
| `src/content/copy/*` (`hero.concept`, `footer`, `performance.modelNote`, `contact.body`) | Concept and model labelling. |
| `public/media/renders/hero-exterior-*.webp`, `src/content/media.ts` (`heroExterior`) | The hero posters: adaptations of the model, so also CC BY-NC-SA. Re-render after a model change. |

Migration path to a commercial-ready build:

1. Get either a written commercial licence from the author (Ddiaz Design), which must also resolve the "Racing Master" upstream rights, or a replacement model with a commercial licence (commissioned, or bought with a licence that allows marketing use).
2. With a replacement, run it through `npm run model:build` after updating `scripts/model/config.mjs` for its texture and node names. Output the same model contract (node names, `extras.badge`, origin, units), so the runtime code doesn't change.
3. Re-author `src/content/cameraShots.ts` where the framing differs, and run `npm run check:camera`. The cabin path in particular is fitted to this model.
4. Replace `lc300.LICENSE.txt` and `siteConfig.modelCredit` with the new licence terms. Re-render any posters from the new model.
5. Only then revisit the concept labels, `noindex`, the contact chapter and the Toyota trademark review. Commercial use also needs trademark clearance from Toyota, which no model licence grants.

## 3D model

### Provenance

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Title          | 2022 Toyota Land Cruiser 300 VX.R (`FINAL_MODEL_22.fbx`)       |
| Author         | Ddiaz Design (@ddiaz-design)                                   |
| Source URL     | https://sketchfab.com/3d-models/2022-toyota-land-cruiser-300-vxr-3dfcd7904cdb4e52afa3ce59fa59e1a5 (short link https://skfb.ly/pAzDs) |
| Licence        | CC BY-NC-SA 4.0: http://creativecommons.org/licenses/by-nc-sa/4.0/ |
| Upstream       | The model page says "Based on a Racing Master 3d model". Credits: https://www.facebook.com/p/GM25-100042237200164/ |
| Obtained       | 2026-10-15                                                     |
| Attribution    | "2022 Toyota Land Cruiser 300 VX.R" by Ddiaz Design (based on a Racing Master 3D model; credits: GM25), CC BY-NC-SA 4.0, converted and modified for this site. |

#### What CC BY-NC-SA means for this project

| Term | Consequence |
| --- | --- |
| **BY**: attribution | Credit the author, link the source and the licence, and say that the model was modified. The credit is in `siteConfig.modelCredit`, shown in the footer, and in `public/models/lc300.LICENSE.txt` next to the GLB. |
| **NC**: non-commercial | The model may **not** be used "primarily intended for or directed towards commercial advantage". A personal or portfolio concept is fine. **Importer marketing, lead generation or any client-paid deployment is not.** |
| **SA**: share-alike | `lc300.glb` and every render or poster made from it are adaptations. They must be distributed under CC BY-NC-SA 4.0 too. This applies to the model and renders only, not to the site's own code or copy. |
| Modifications | Allowed: format conversion, material changes and the badge split, provided the changes are indicated. |
| Trademarks | CC grants no trademark rights. The Toyota rules below still apply. |

Status:

- Non-commercial use (local development, a portfolio or concept deployment) may continue. The credit is complete and shown in the footer.
- **Upstream risk.** "Racing Master" is a commercial racing game, and the tyre texture carries its "RACING MASTER" branding. This model appears to be derived from a game asset. A CC licence is only valid if the uploader held the rights to grant it, which can't be verified from here. **Accepted (2026-10-15)** for a noindex, non-commercial portfolio. If the original rights holder objects, take the model down and replace it.
- **Decision (2026-10-15): the site stays a non-commercial portfolio concept.** Any future commercial use (importer, dealer, client work) first needs a commercial licence from the author, or a replacement model run through the same pipeline.

### Files

Source files live in `assets-src/lc300/`. The folder is **git-ignored** because of its size, so keep it backed up elsewhere.

```
assets-src/lc300/
  original/        the downloads, unchanged (2022-toyota-land-cruiser-300-vxr.zip, FINAL_MODEL_22.zip)
  source/          FINAL_MODEL_22.zip extracted: FINAL_MODEL_22.fbx + 50 T_*.png
  build/           pipeline output (regenerated by every build)
    channels/      every RME texture split into _R/_G/_B greyscale PNGs
    textures/      repacked PNGs fed to the KTX2 encoder
    lc300.raw.glb  unoptimised conversion, for debugging
    report/        build.json, inspect-*.md, rme-channels.png, renders/
```

### What the source contains (findings)

- **Geometry:** binary FBX 7.7, already in metres, +Y up, front at +Z. It has 130 meshes and 408,529 triangles.
- **Texture binding:** the FBX embeds and binds only base colour and a few normal maps. Everything else is bound by naming convention in `scripts/model/config.mjs`.
- **Texture suffixes:** `D` base colour, `N` normal, `RME` (R roughness, G metallic, B emissive mask), `E` emissive, `AO` occlusion (R channel).
- **Palette strip:** most textures carry a palette strip along the bottom edge. Small parts (rims, brake hardware, trim) take their colour, roughness and metalness from it through their UVs, so base-colour alpha is not opacity there.
- **Normal maps are mixed.** Most are DirectX (green down), but `T_Rim_N`, `T_Brake_N` and `T_Cabin_DP_N` are OpenGL. The pipeline detects this per texture (mixed-derivative test, validated on a synthetic height field) and flips only the DirectX maps. `T_Suspension_N` is inconclusive and is left as authored.
- **`T_InteriorRef_D` and `T_EngineRef_D`** are spherical reflection captures (fake environment reflections), not reference photos. They are not shipped.
- **Not shipped (unused or empty):** `T_Cabin_DP_*` (an interior atlas no mesh UV uses), `T_Engine_E` and `T_Cabin_DP_E` (black), `T_Brake_E` (hot-brake glow; its RME emissive mask is 0), and `T_Leather_N` (a tiling detail normal, for which glTF has no slot).
- **Flat or uniform maps** become material factors: `T_Grid_B_N` and `T_Dashboard_N` are flat, and `T_Grid_B_RME` and `T_Dashboard_RME` are uniform.
- **Badges.** The body badges are islands inside the trim meshes. The meshes with the logo material on the bumper and tailgate are the parking cameras. Rules in `config.mjs` extract the badges by island and bounding box.
- **Wheels.** The source pivots are within 0.4 mm of the wheel centres. The calipers (13–15 cm off the axle) are split out so they don't spin. In the source, the front-right wheel sits 1.4 cm lower than the other three. This is left as is.

### Pipeline: `npm run model:build`

Runs in Node with no Blender: three.js `FBXLoader`, glTF-Transform, sharp, and a WASM Basis encoder.

1. Load the FBX. Match embedded textures to the source PNGs by hash.
   Apply source-texture edits (`edits.mjs`, `textureEdits` in `config.mjs`). The tyre sidewall's "RACING MASTER" lettering band (radius 210–246 px) is replaced in D, N and RME by its rotationally symmetric profile, taken as a per-radius median from the clean angles. Normals are filled in a polar frame so the relief follows the ring. The band ends up slightly smoother than the rest of the sidewall, which is not visible at normal viewing distances.
2. Prepare textures (`textures.mjs`):
   - Split RME into separate channel PNGs, then repack it as ORM (R = AO or 1, G = RME.R, B = RME.G).
   - Normal maps: per-texture convention detection, flipping green only on DirectX maps.
   - Emissive: E × RME.B where the mask is used (lamps, factor 1). Where the mask is 0, the E map is kept at factor 0, off by default (dashboard, cabin buttons).
3. Convert (`convert.mjs`):
   - Move the origin to the bottom centre and flip V for glTF UVs.
   - Name part nodes and build hub, wheel and caliper nodes at the wheel centres.
   - Extract badge nodes with `extras.badge`.
4. Optimise:
   - Geometry: `dedup`, `prune`, `weld`, `join` (within each mesh), Meshopt.
   - Textures: KTX2, UASTC for normals and ETC1S for colour and ORM, with mipmaps, max 2048².
5. Report against the budget and fail if over.

`npm run model:inspect` prints the mesh, material and texture tables (`-- --glb` inspects the output). `npm run model:render` renders review images in headless Chrome through the same Meshopt and KTX2 decode path the site uses.

### Current output

| Metric     | Value          | Budget |
| ---------- | -------------- | ------ |
| File size  | 5.30 MB        | ≤ 8 MB |
| Triangles  | 408,529        | ≤ 400k (**over by 8.5k**) |
| Draw calls | 112            |        |
| Materials  | 18             |        |
| Textures   | 35 KTX2, ≤ 2048² |      |

**Proposal to get under 400k (not applied yet):**
- The engine (`engine`, 47.8k triangles, plus 6.6k under the hood) is invisible while the hood is closed. Remove it, or simplify it to about 10%, unless a chapter opens the hood. Either change alone brings the total to about 355–360k.
- If more headroom is needed, simplify the interior. `interior`/`interior_leather` total 158k triangles. Seen only through glass, a 50% `simplify` on the largest cabin meshes would save about 50k.

### Known material work for the runtime

- `trim` (`T_tongyong_D`) has no RME, so chrome trim and the white grille bars render as plastic. Set roughness and metalness per region at runtime, or author a trim RME.
- Rims take metalness from the palette strip and read as white plastic under neutral light. Tune this at runtime, together with the paint colour (the source paint is orange).

## Rendered posters

A rendered poster is a still frame used as a `MediaFrame` fallback for a **3D chapter**. It is what visitors without the experience layer see, and what the canvas crossfades from.

Rules:

- It must be rendered from the licensed project model (above), not from stock or AI imagery. Under share-alike, posters are CC BY-NC-SA 4.0 adaptations: non-commercial only, and credited like the model.
- It must match the chapter's first camera keyframe in `src/content/cameraShots.ts`, with the same lighting and environment, so the poster-to-canvas handoff is seamless. Capture it from the real-time scene at that keyframe. A higher-quality offline render is acceptable only if it is visually matched.
- It is an `ImageAsset` with `origin: "render"`. Its licence records the model's licence:

  ```ts
  license: {
    credit: "<model author>",
    terms: "Rendered from licensed 3D model — <source>; CC BY-NC-SA 4.0",
    url: "<model source URL>",
  }
  ```

- `alt` describes the image as a rendering, for example "Rendering of a Land Cruiser 300, three-quarter front view, at dusk".
- Photography slots (`origin: "photograph"`) stay photography. A render can't fill a slot whose brief asks for a photograph.
- Files go in `public/media/renders/` at 3840×2160 master.

### Assets that need a commercially compatible licence

Before any commercial use, every one of these must be replaced or relicensed:

| Asset | Current licence | Needed |
| --- | --- | --- |
| `public/models/lc300.glb` | CC BY-NC-SA 4.0, with an unverified "Racing Master" game-asset upstream | A commercial licence from the author that also clears the upstream, or a commissioned or commercially licensed model |
| `public/media/renders/hero-exterior-*.webp` | CC BY-NC-SA 4.0 (adaptation of the model) | Re-render from the commercial model |
| Any render or screenshot of the 3D scene used elsewhere (social, press) | CC BY-NC-SA 4.0 | As above |
| Toyota names and the badges on the model | Trademarks; no licence held | Trademark clearance from Toyota (or a de-badged model) |
| HDRIs (Poly Haven) | CC0 | None: commercially usable as is |
| Fonts (Unbounded, Inter Tight via `next/font`) | SIL OFL | None |

## Required

| Slot (`src/content/media.ts`) | Brief                                                                                     | Origin              | Format             |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ------------------- | ------------------ |
| `heroExterior`                | Three-quarter front, low camera, dark studio, vehicle right of the title | render (3D chapter), **filled** | 3840×2160 16:9, plus an 860×1864 portrait crop |

The hero posters are captured from the real-time scene (`?tier=high`, page DOM hidden, after the load-in settles): 1920×1080 at DPR 2, and 430×932 at DPR 2 for the portrait crop that `MediaFrame` serves to phones in portrait through `<picture>`. They are encoded as WebP q86. Re-capture them whenever the hero key, the lighting or the materials change, or the poster-to-canvas handoff will jump.

More slots will be added with each section: interior, detail macros, terrain/environment, a night exterior and an optional hero video loop. For each one, decide whether it is a 3D chapter (render poster) or a photography slot.

## Optional (3D)

- HDRI (studio): "Studio Small 09" by Sergej Majboroda, Poly Haven, **CC0**. Source: https://polyhaven.com/a/studio_small_09. Shipped as `studio_small_09_1k.hdr` (1.6 MB), the dimmed room of the virtual studio. The cards in `Studio.tsx` do most of the lighting.
- HDRI (steppe dusk): "Belfast Sunset" (photography Dimitrios Savva, processing Greg Zaal), Poly Haven, **CC0**. Source: https://polyhaven.com/a/belfast_sunset. It was chosen for the dry grass, flat open horizon and dusk sky.
  - `belfast_sunset_1k.hdr` (1.6 MB) is used for reflections.
  - `belfast_sunset_backplate_4k.webp` (4096×2048, WebP q80) is the visible sky and ground. It was resized from Poly Haven's tonemapped JPG.
  - It is a South African location standing in for the Mongolian steppe, so the site must not caption it as Mongolia.

## How to add an image

1. Place the file in `public/media/vehicle/`, `public/media/environment/` or `public/media/renders/`.
2. Fill the slot's `asset` in `src/content/media.ts` with `src`, `alt`, `width`, `height`, `origin`, `license` and an optional `focus`.
3. `MediaFrame` switches from the pending frame to `next/image` automatically.

## Specifications

Add specifications to `src/content/vehicle.ts` only from official Toyota sources or homologation documents. Each one must record its market.

Current status (checked 2026-10-15):

- **Japan:** everything in `src/content/vehicle.ts` comes from Toyota's official sheet, [主要諸元表・主要装備一覧表, March 2025](https://toyota.jp/pages/contents/landcruiser300/004_p_001/pdf/landcruiser300_spec_202503.pdf): engines, gearing, fuel economy (WLTC), dimensions, weights, wheels and the grade table from the specification table (page 1), and equipment availability per grade from the colour-coded equipment table (pages 3–4, read from a high-resolution render). Only equipment whose availability could be read unambiguously is listed. Prices are left out on purpose.
- **Not added:** towing capacity and payload, for any market. Toyota Australia and the GCC distributors' pages couldn't be read (HTTP 403), and searches only found press, dealer leaks and third-party catalogues. The Japanese sheet has kerb weight and GVW per grade but no towing figure.
- **GCC (the VX.R this model depicts):** no official figures yet.
