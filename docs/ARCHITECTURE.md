# Architecture

## Rendering model

- Every section is a **Server Component** and renders complete, readable markup with no JavaScript. That markup is the reduced-motion and no-JS experience.
- Motion and 3D are **added from client wrappers**. They never replace server markup.
- `cacheComponents` and `partialPrefetching` are on (the Next 16 defaults). The home page currently prerenders fully static.

## Design tokens

`src/app/globals.css` is the single source of truth:

- Colour: `ink-*` surfaces, `silver-*` type, `signal` accent. The default Tailwind palette is cleared (`--color-*: initial`), so only tokens are available.
- Type: `font-display` (Unbounded, used light and uppercase) and `font-sans` (Inter Tight). Both are loaded with `latin` and `cyrillic` subsets for a future `mn` locale. The fluid editorial scale is `text-display-xl/lg/md`, `text-lede` and `text-eyebrow`.
- Layout: the `frame` utility (max 1600px plus a fluid gutter), and the `gutter`, `section` and `header` spacing tokens.
- Motion: `ease-cinematic` and `ease-drift`, mirrored in `src/lib/motion/tokens.ts` for JS.

## Planned: GSAP ScrollTrigger

Not installed yet. Add it when the first scroll-scrubbed scene is built, not before.

1. `npm i gsap @gsap/react`
2. Create `src/components/motion/ScrollScene.tsx` (`"use client"`). It takes a `ref` to server-rendered children and builds a timeline in `useGSAP` (which handles cleanup and context scoping). It registers `ScrollTrigger` once, at module level.
3. Gate every timeline on `usePrefersReducedMotion()`. When it returns true, skip the timeline and leave the static layout in place.
4. Use easing and duration from `src/lib/motion/tokens.ts`.
5. Sections stay Server Components: `<ScrollScene><HeroSection /></ScrollScene>` from `page.tsx`.
6. Don't add `scroll-behavior: smooth` or a smooth-scroll library without measuring. Both interfere with ScrollTrigger pinning.

## Planned: Three.js / React Three Fiber

Not installed. Introduce it only once a licensed LC300 model exists (see ASSETS.md). A primitive or "fake" car is not acceptable.

1. `npm i three @react-three/fiber @react-three/drei` (check versions against React 19 at install time).
2. Put scenes in `src/components/three/`. Load them with `next/dynamic(..., { ssr: false })` **from a Client Component** (`ssr: false` isn't allowed in Server Components).
3. The canvas is progressive enhancement. The section first renders the licensed still photograph through `MediaFrame`, then swaps to the canvas once the model has loaded on capable devices.
4. Serve models from `public/models/` as Draco/Meshopt-compressed GLB.
