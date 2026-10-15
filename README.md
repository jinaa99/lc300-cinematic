# LC300 Cinematic

A cinematic, scroll-driven presentation of the Toyota Land Cruiser 300, built as a non-commercial portfolio concept, imagined for the Mongolian market.

Independent design concept. Not affiliated with Toyota Motor Corporation. Not for commercial use: the 3D model is licensed CC BY-NC-SA 4.0 (see `docs/ASSETS.md`).

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
  app/[lang]/     Routes per locale (/ English, /mn Mongolian), root layout, metadata, fonts
  app/            globals.css (design tokens)
  proxy.ts        Locale routing (see docs/ARCHITECTURE.md, "Languages")
  sections/       Full-width page chapters (HeroSection, …)
  components/
    layout/       Site chrome: header, footer
    media/        MediaFrame: licensed image or explicit pending frame
    ui/           Small typographic primitives
  content/        Media slots, verified specs, scene keyframes, paint finishes
    copy/         Site copy per locale (en, mn), typed by SiteCopy
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

- No vehicle specification, price, inventory, dealer detail or testimonial appears unless it is sourced. `VehicleSpec` and `VehicleFeature` require a `source` that records the market and the document edition. Editorial copy (`src/content/copy`) states no vehicle facts.
- English is the default language (`/`); Mongolian is at `/mn`. Both are complete; every `SiteCopy` key is required for each locale.
- No media appears unless it is licensed. `ImageAsset` requires a `license` and an `origin` (`photograph` or `render`). Until a file is supplied, `MediaFrame` renders a pending frame instead of a stand-in visual: labelled with the slot id and brief in development, a plain studio tone in production.
- The site is `noindex` while it remains a concept. It is labelled as a non-commercial concept in the hero and the footer, because the 3D model is CC BY-NC-SA 4.0. See "Commercial use" in `docs/ASSETS.md` before changing that.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, used as `metadataBase`. Set it in production. |
| `NEXT_PUBLIC_CONTACT_HREF` | Contact link for the closing chapter: a `mailto:` or `https://` URL. Unset, the chapter says contact details will follow. A malformed value fails the build. Never a sales or lead form. |
