# Architecture

> **Status:** the experience layer is live. A scroll-scrubbed master timeline drives one continuous camera move and scene change through all eight chapters (see "Scroll choreography").

## Rendering model

The page has two layers:

1. **Static layer (always present).** Every section is a **Server Component** and renders complete, readable markup with no JavaScript, including its poster image through `MediaFrame`. This is the no-JS, reduced-motion and low-power experience, and it is also the first paint for everyone.
2. **Experience layer (progressive enhancement).** One fixed, full-viewport WebGL canvas, `<Experience>`, is mounted once in the root layout behind `<main>`. On capable devices it loads the LC300 model and takes over from the posters. Sections scroll over it and drive it through a shared scroll store.

The experience layer never replaces server markup. It only hides poster images (visually) once it has rendered its first frame.

`cacheComponents` and `partialPrefetching` are on (the Next 16 defaults). The home page prerenders fully static. The experience layer is a client-only island and doesn't change that.

## Layout and stacking

```
<body>
  <ExperienceRoot />        fixed inset-0, z-0, aria-hidden, pointer-events-none (client)
  <SiteHeader />            fixed, z-50
  <main id="main">          relative, z-10
    <Chapter id="hero">     client wrapper: registers the element with the scroll store
      <HeroSection />       Server Component, passed as children
    </Chapter>
    …
  </main>
  <SiteFooter />            relative, z-10, opaque background
</body>
```

- `ExperienceRoot` (`src/components/experience/ExperienceRoot.tsx`, `"use client"`) is imported by `src/app/layout.tsx`. It decides whether the experience may run (see "Capability gate") and only then renders `Experience` through `next/dynamic(() => import(...), { ssr: false })`. `ssr: false` is only allowed inside a Client Component, which is why the dynamic import lives here and not in the layout.
- Because the import is behind the gate, devices that fail it never download `three` or the model.
- 3D chapters have transparent backgrounds so the canvas shows through. Non-3D sections and the footer use opaque `bg-ink-950`, which covers the canvas.
- The canvas uses `100lvh` (large viewport height) so mobile browser bars appearing or disappearing don't resize the drawing buffer.

## Capability gate

Two steps, in `ExperienceRoot`:

1. **Synchronous** (`useExperienceGate`). Reduced motion, Save-Data or no WebGL2 → `"off"`. The server snapshot is `"off"`, so server HTML and hydration always match the static layer.
2. **GPU lookup** (`src/lib/experience/gpu.ts`, loaded on demand). detect-gpu matches the GPU against its benchmark tables. The tables are served locally from `/detect-gpu`, copied on install by `scripts/copy-decoders.mjs`, so there is no CDN request. A device reporting under 4 GB of memory is capped at low.

| detect-gpu | Tier | Preset |
| --- | --- | --- |
| tier 0, WebGL unsupported, blocklisted | `off` | Posters only. `three` is never downloaded. |
| tier 1, or unknown GPU on mobile | `low` | DPR 1, native MSAA, no post-processing, no dust, plain floor, 64² reflections. Renders **on demand**: no idle motion, so a still frame costs nothing. |
| tier 2, or unknown GPU on desktop | `medium` | DPR ≤ 1.5. SMAA, bloom, vignette, grain (no depth of field). Dust. 128² reflections. |
| tier 3 | `high` | DPR ≤ 2. Adds depth of field, glass transmission, the reflector floor and 256² reflections. |

- `PerformanceMonitor` steps down one tier per sustained frame-rate drop and never steps back up.
- `?tier=off|low|medium|high` overrides the gate for testing.
- The effective tier is on `<html data-experience-tier>`.

## Start, loading and handoff

1. The static layer paints with the posters visible.
2. When the gate passes, the 3D layer waits for `load` plus an idle callback (timeout 2.5 s), so it never competes with the first paint or hydration.
3. `LoadingIndicator` shows a hairline silver bar and a percentage on an ink strip at the bottom edge, from drei's `useProgress`. The hero's server markup stays visible the whole time.
4. When everything has loaded, `LiveSignal` compiles every shader up front (`renderer.compileAsync`), waits two frames, then sets `<html data-experience="live">`.
5. CSS fades the posters (`[data-media-role="poster"]`) and the loading bar. The posters stay in the DOM, so their alt text stays in the accessibility tree.
6. On an error, `data-experience` is removed and the posters come back.

**Frame loop.** Medium and high render continuously while the canvas can be seen; low renders on demand. On demand means scroll, input and paint changes call `motionMode.invalidate`, and `KeepAlive` keeps requesting frames while any controller reports itself busy. Rendering stops entirely (`"never"`) when any of these is true:

- the tab is hidden;
- `<main>` has scrolled out of view (`IntersectionObserver`);
- the closing fade has fully covered the canvas (`FrameOverlays` reports `faded`).

## Experience store

`src/lib/experience/store.ts` is a zustand store (`useExperience`) for low-frequency state only: capability, the `degraded` flag, status, debug and free camera, paint, lamp intensity, environment intensity, exposure, tone mapping and `showBadges`. Components read these with selectors; `selectTier` returns the effective tier.

Per-frame values don't go through React. They live in the motion proxy (below).

## Scroll choreography

- **Shot list as data.** `src/content/cameraShots.ts` holds the keys. Each key pins a camera position, a target and a `Look` (fov, lens shift, steppe/night blend, environment, rim, lamps, tail lamps, letterbox, depth of field, wheel spin, vehicle travel, turntable, dust, glass, fade, portrait weight) to a scroll point: `chapter` plus `at`. `at` runs 0→1 across the section's pinned range; negative values are waypoints during the section's entry. Each key inherits the previous key's look.
- **Motion proxy.** `src/lib/motion/state.ts` exports `motion`, a plain object (`path` + `Look`), plus `intro` (the load-in), `motionMode`, `turntableInput` and `cameraProbe`. Nothing in it triggers a render.
- **Master timeline.** `src/components/motion/ScrollDirector.tsx` builds one GSAP timeline whose time is in scroll pixels. Each key's tween lands exactly on its section, and the timeline is scrubbed over the whole page with `ScrollTrigger` (`scrub: true`). Eases come from `src/lib/motion/tokens.ts` via `CustomEase`. The timeline is rebuilt on resize and once fonts load. GSAP plugins are registered once, in `src/components/motion/gsap.ts`. Import GSAP from there.
- **Smoothness without a smooth-scroll library.** Scroll moves the proxy instantly; the canvas eases toward it every frame with `maath/easing`. The camera's curve parameter is damped and evaluated on a centripetal `CatmullRomCurve3` through every key, so the camera stays exactly on the authored path. Damping the position instead would cut corners and clip inside the cabin. The look-at point uses `damp3`.
- **Clipping check.** `npm run check:camera` samples the same curve and fails if any point comes within 0.1 m of the model (glass excluded; glass hides while the camera passes through it). The Interior shot enters through the windshield on the driver's side, clear of the mirror, and leaves the same way. The cabin is too tight (≤ 0.13 m) to exit through the tailgate. Run the check after editing keys. The camera near plane is 5 cm.
- **Per-frame controllers.** `src/components/three/controllers/` holds `camera`, `vehicle` (travel, wheel roll and spin, turntable, front and tail lamps, glass), `studio` (studio → steppe dusk → night blend of reflections, backplate, fog, floor and lightformers) and `dust`. They are plain modules, so three.js objects are mutated outside React's render rules (the React Compiler lint forbids mutating hook values). Components only wire them up in `useFrame`.
- **Environment blend.** The reflection environment (`ReflectionEnvironment.tsx`) is a virtual scene: a studio HDRI sphere, a steppe HDRI sphere and unlit softbox cards, with opacities from the proxy. It is baked into a cube map only when steppe, night, rim or the load-in change. The bake forces `autoClear` on, because the effect composer turns it off; without that, the faces accumulate and the reflections brighten. The camera sees ink in the studio and the steppe backplate outside. Fog and floor colours are sampled from the backplate.
- **Overlays.** The 2.39:1 letterbox (landscape only) and the fade to ink are DOM layers inside the fixed 3D layer, under the page text, updated on GSAP's ticker (`FrameOverlays.tsx`).
- **Turntable.** `TurntableControl.tsx` in the Colour chapter is a drag area plus arrow keys (`role="slider"`), independent of scroll. It weighs in only while the proxy's `turntable` is up.
- **Reduced motion.** With the default gate the 3D layer doesn't load at all. If it is forced on (`?tier=`), the director builds no timeline. Each chapter snaps to its settled frame (its last key) without damping, and nothing auto-rotates.
- **Authoring.** With `?debug`, the leva "Camera" folder has "free (orbit)" and "copy camera". Copy camera puts `{ position, target, look: { fov } }` on the clipboard, ready for a key.

## Studio, materials and effects

- `src/components/three/Experience.tsx` sets up the `<Canvas>`:
  - `dpr` is `[1, 2]` on the high tier and 1 on the low tier.
  - Output is sRGB, with AgX tone mapping by default (ACES Filmic is selectable).
  - The camera follows the shot list (`CameraDirector` → `controllers/camera.ts`). The lens shift (`setViewOffset`) recomposes the frame without tilting the camera. Portrait viewports pull back, widen and lift the subject, except inside the cabin.
  - `frameloop` is `"always"`, or `"never"` while the tab is hidden. The canvas is always on screen now: the page scrolls over it.
  - `PerformanceMonitor` steps the tier down once.
- `Lc300.tsx` loads the model with `useGLTF`, with Draco off and Meshopt plus KTX2 decoders served from `/basis/`. It applies `materials.ts` and follows the store for paint, lamps and badges.
- `materials.ts` upgrades every glTF material to `MeshPhysicalMaterial` and tunes it by name:
  - Paint: clearcoat 1, clearcoat roughness 0.03.
  - Glass: transmission on the high tier only.
  - Chrome (badge, grille): metalness 1, roughness 0.12.
  - Trim: metalness comes from base-colour luminance, so the light swatches read as chrome and the dark ones as gloss black.
  - Rim: roughness 0.25.
  - Tyre: roughness 0.9, with a stronger normal map.
- `Studio.tsx` builds the studio:
  - The reflection environment is a virtual studio rendered once into a cube map. The HDRI (Poly Haven Studio Small 09) is the dimmed room. Lightformers act as softboxes: overhead, tall side cards, a sill kicker, a front card and a rim ring. The raw HDRI on its own lights everything evenly and flattens the paint.
  - The floor is a reflector on the high tier and a plain dark floor on the low tier. Fog uses the `ink-950` token.
  - `ContactShadows` are baked once when the experience goes live, inside the vehicle group, so the shadow travels and turns with the vehicle. **Keep it at y=0.** Its blur pass draws a plane at the world origin from the shadow camera, and raising the component even 2 mm blanks the shadow.
- `Effects.tsx` (medium and high) runs SMAA instead of MSAA, then bloom (threshold 1.6, mipmap blur), tone mapping, vignette and grain (opacity 0.03). The high tier adds depth of field. Every strength comes from the shot list: `dof` with its focus point (non-zero only in Light and Interior), `bloom`, `vignette` and `noise`.
- **Handheld.** A simplex-noise rotation of at most 0.15° (`handheld` in the shot list, lowered inside the cabin), applied after the camera aims. It is off on the low tier and in reduced motion.
- **Narrow screens.** The shots are framed for 16:9. On narrower screens the camera keeps the 16:9 horizontal field: the vertical fov widens up to 58° and the camera pulls back for the rest, so the whole vehicle stays in frame. On stacked (phone) layouts the subject moves to the upper half. `portrait` in the shot list weights this, and it is 0 inside the cabin. `npm run check:camera` also checks the path at a phone aspect. The composer disables renderer tone mapping while active, so tone mapping is applied inside the composer.
- URL switches:
  - `?debug` opens the leva look-dev panel (`DebugPanel.tsx`, loaded only then) and gives pointer input to an orbit camera.
  - `?tier=off|low|high` forces a tier.
- `scripts/screenshot.mjs <url> <out.png>` screenshots a page in headless Chrome once `data-experience="live"` is set.

## Model contract (`public/models/lc300.glb`)

The model is built by `npm run model:build` (see ASSETS.md, "Pipeline"). Runtime code may rely on:

- +Y up, metres, front towards +Z, driver's left towards +X, origin at the bottom centre (ground plane).
- Part nodes named by function: `body`, `hood`, `tailgate`, `door_FL/FR/RL/RR`, `lamp_front`, `lamp_rear`, `mirror_L/R`, `bumper_front/rear`, `engine`, `cockpit`, and others. Door, hood and tailgate pivots are still at the origin. Set hinge pivots in the pipeline before animating them.
- `wheels/hub_<FL|FR|RL|RR>`: positioned at the wheel centre, for steering and suspension. Its child `wheel_<id>` spins about local X (tyre, rim, disc). `caliper_<id>` sits beside it and never spins.
- Badge nodes (`badge_front`, `badge_rear`, `badge_rear_name`, `badge_rear_grade`, `badge_rear_engine`, `badge_wheel_<id>`) carry `extras.badge = true`. Their visibility follows `siteConfig.showBadges`.
- Materials are named `paint`, `glass`, `lamp`, `lamp_lens`, `lamp_lens_red`, `rim`, `tyre`, `trim`, and others. `lamp` has emissive on (factor 1). `dashboard` and `interior` carry emissive maps at factor 0 (`extras.emissiveDefault`), ready for a night scene.

## Chapters and copy

- `src/app/page.tsx` renders the chapters in order: Hero, Design (#design), Light, Terrain, Interior, Performance, Colour and Contact. `siteConfig.nav` lists the same ids. The header shows the nav from `lg` up.
- Every chapter after the hero uses `StickyChapter` (`src/components/layout/StickyChapter.tsx`), a Server Component. Each chapter is a 150–250vh scroll track with its eyebrow, title and body pinned (`position: sticky`). The extra track length is room for the camera moves to come.
  - Text sits in the left column from `md` up and at the bottom on phones. The scrim follows the text.
  - All chapters are transparent over the 3D layer, with a scrim behind the text.
- Copy lives in `src/content/copy/` (`en.ts`, `mn.ts`, typed by `SiteCopy`). Components call `getCopy()`, which returns `defaultLocale` (`en`). `mn` is complete but not routed yet: adding a locale segment is a routing change only. Copy states no vehicle facts. Figures come only from `vehicleSpecs`, with their source.
- Colour (`ColourPicker.tsx`) is the only client island in the chapters. It writes a finish from `src/content/finishes.ts` to the store. Without the live 3D layer it renders as a disabled, labelled list.
- Every chapter is now a 3D chapter (transparent). `StickyChapter` uses `items-center-safe`, so content taller than the viewport starts below the header.

## Design tokens

`src/app/globals.css` is the single source of truth:

- Colour: `ink-*` surfaces, `silver-*` type, `signal` accent. The default Tailwind palette is cleared (`--color-*: initial`), so only tokens are available.
- Type: `font-display` (Unbounded, used light and uppercase) and `font-sans` (Inter Tight). Both are loaded with `latin` and `cyrillic` subsets for a future `mn` locale. The fluid editorial scale is `text-display-xl/lg/md`, `text-lede` and `text-eyebrow`.
- Layout: the `frame` utility (max 1600px plus a fluid gutter), and the `gutter`, `section` and `header` spacing tokens.
- Motion: `ease-cinematic` and `ease-drift`, mirrored in `src/lib/motion/tokens.ts` for JS (camera easing included).

## Dependencies

- `detect-gpu` 5.0 for the capability gate. Its benchmark tables are served from `/detect-gpu`, not the CDN.
- Installed: `three` 0.186.1 (pinned; `postprocessing` 6.39 requires `<0.187`), `@react-three/fiber` 9.8 (React `>=19 <19.4`), `@react-three/drei` 10.7, `@react-three/postprocessing` 3.2, `zustand` 5 and `leva` 0.10 (loaded only for `?debug`). Re-check the peer ranges when upgrading React or three.
- `gsap` 3.15 + `@gsap/react` (ScrollTrigger, CustomEase) and `maath` for damping. No smooth-scroll library and no `scroll-behavior: smooth`: damping in the canvas gives the smoothness, and native scrolling stays native.

## Performance budget

| Item                                          | Budget            |
| --------------------------------------------- | ----------------- |
| `lc300.glb` (geometry + textures)             | ≤ 8 MB transfer (now 5.3 MB) |
| Triangles drawn (whole car)                   | ≤ 400k (now 408.5k, see ASSETS.md) |
| Largest texture                               | 2048² (KTX2)      |
| Experience JS chunk (three + r3f + drei used) | ≤ 250 kB gzip     |
| Static-layer LCP                              | Unaffected (poster `preload`) |

The model and HDRI start loading only after the gate passes and the browser is idle (`requestIdleCallback`, with a timeout fallback). They never compete with the poster LCP.

### Measured (Lighthouse 12, production build on localhost, 2026-10-15)

| Run | Perf | A11y | Best practices | SEO* | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile (simulated Moto G, 4× CPU) | 70 | 100 | 100 | 60 | 2.9 s | 1.13 s | 0 |
| Desktop (GPU enabled) | 98 | 100 | 100 | 60 | 0.6 s | 90 ms | 0 |

\* SEO is 60 only because the site is `noindex` on purpose (concept build).

- Mobile TBT was 9.6 s before three changes: on-demand rendering on the low tier, reflection bakes only on change, and the 3D start deferred to idle. It is now the cost of evaluating three.js and the first scene setup under 4× CPU throttling.
- On localhost, `next start` doesn't compress the `.hdr` files (about 0.5 MB saved with gzip) and serves HTTP/1.1. Let the production host handle compression and HTTP/2.
- Reports are in `assets-src/lc300/build/report/lighthouse/`.
