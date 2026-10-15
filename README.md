# LC300 Cinematic

A cinematic, scroll-driven presentation of the Toyota Land Cruiser 300, built as a concept for a Mongolian vehicle importer.

Independent design concept. Not affiliated with Toyota Motor Corporation.

## Stack

- Next.js 16 (App Router, Turbopack, Cache Components)
- React 19, TypeScript (strict)
- Tailwind CSS v4 (tokens in `src/app/globals.css`)
- npm (`package-lock.json`). Don't add another lockfile.

## Scripts

| Command             | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Dev server at http://localhost:3000            |
| `npm run build`     | Production build                               |
| `npm start`         | Serve the production build                     |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TypeScript)  |
| `npm run typecheck` | Generate route types, then `tsc --noEmit`      |

## Structure

```
src/
  app/            Routes, root layout, metadata, fonts, global tokens
  sections/       Full-width page chapters (HeroSection, …)
  components/
    layout/       Site chrome: header, footer
    media/        MediaFrame: licensed image or explicit pending frame
    ui/           Small typographic primitives
  content/        Typed site copy, media slots, verified specs
  types/          Content contracts (provenance and licensing required)
  hooks/          Client hooks (reduced motion, …)
  lib/            Utilities; motion/ holds JS motion tokens
public/
  media/          Licensed photography and video (see docs/ASSETS.md)
  models/         Licensed 3D models (glTF/GLB), when available
docs/
  ARCHITECTURE.md Rendering, motion and 3D integration plan
  ASSETS.md       Required assets and licensing rules
```

## Content rules

- No vehicle specification, price, inventory, importer detail or testimonial appears unless it is sourced. `VehicleSpec` requires a `source` that records the market it applies to.
- No media appears unless it is licensed. `ImageAsset` requires a `license`. Until a file is supplied, `MediaFrame` renders a labelled pending frame instead of a stand-in visual.
- The site is `noindex` while it remains a concept.

## Set `NEXT_PUBLIC_SITE_URL` in production

It is used as `metadataBase`.
# lc300-cinematic
