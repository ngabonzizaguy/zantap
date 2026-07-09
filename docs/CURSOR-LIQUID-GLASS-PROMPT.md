# ZanTap — Liquid-Glass Front-End Redesign

You already know this codebase and its structure. This is a **front-end visual
redesign only** — no data-layer, routing, or business-logic changes, and no
regressions to existing flows (cart, checkout, MoMo PIN `12345`, KDS order
lifecycle, tabs, modals, exports).

**Attached:** two background images + `glassliquidmorphism.html` (the reference).

---

## The goal
Give both screens a **true liquid-glass** look matching `glassliquidmorphism.html`,
each set over its own background image. UI panels must read as frosted,
translucent, light-**refracting** glass floating over the photo.

- **Storefront** (`/[slug]`) → the **warm kitchen** image → `public/bg/storefront-kitchen.jpg`
- **KDS** (`/vendor/[slug]`) → the **dark hexagon** image → `public/bg/kds-hexagon.jpg`

## Understand the reference
Ignore its GitHub / signature / download demo features. What matters: a WebGL
fragment shader draws a rounded-rect glass region over a full-screen background
and **bends + magnifies + blurs it like a real lens**, with a bright edge rim.
Its sub-panels are plain CSS — `rgba(...,0.07)` fills, `rgba(...,0.45)` borders,
15–34px radii, and an `--ink` var that flips text color for light vs dark backgrounds.

**The key gap:** the app currently fakes glass with CSS `backdrop-filter: blur()`
— that only *frosts* (cloudy plastic). The reference *refracts* (bends the
image). Closing that gap is the whole job. Note the reference does **one** glass
rect; ZanTap has **many scrolling panels** — solve that (see Approach).

## Per-surface rules (same recipe, two tints)
- **Storefront / kitchen bg:** fixed cover background; light frosted panels with
  **dark ink text**; keep the editorial serif headings, black `+` buttons, black
  "All" chip, and colored menu thumbnails.
- **KDS / hexagon bg:** fixed cover background; dark translucent panels with
  **light text** and **brighter edge highlights**; lean into orange/amber accents
  (they match the hexagon glow, the amber amounts, the gold "Orders" button);
  keep the color-coded filter chips and green OPEN / "Paid via MoMo" pills.
- **Both:** WCAG-AA text contrast over imagery (add a scrim if needed), large
  touch targets, verify at mobile widths.

## Approach (prototype the glass engine in isolation first)
- **Path A — hero look (matches reference):** one fixed full-screen canvas behind
  the app renders bg + glass. Generalize the shader to take an **array of
  rounded-rects** fed from the bounding boxes of DOM nodes marked `data-glass`.
  Use **Three.js** (`ShaderMaterial` on a fullscreen quad) + **GSAP** for
  micro-interactions. Risk: mobile perf with many scrolling panels — cap panel
  count, throttle rect updates, test on a real mid-range phone.
- **Path B — fallback (integrates cleanly):** emulate refraction with layered
  `backdrop-filter blur+saturate` + an SVG `feDisplacementMap`/`feTurbulence` edge
  distortion + a specular highlight. Scales to unlimited panels near-free.
- Ship whichever holds ~60fps on mobile; note which and why. Panel styling
  values come straight from the reference CSS either way.

## Order of work (commit after each)
1. Glass-engine spike over **both** backgrounds — prove multiple panels
   refract/frost and perform on mobile; pick Path A or B.
2. Fold the recipe into the shared glass layer with light/dark surface variants.
3. Restyle the **Storefront** over the kitchen bg.
4. Restyle the **KDS** over the hexagon bg.
5. Polish: contrast/a11y, mobile widths, `prefers-reduced-motion`, clean
   `lint` + `build`, screenshot both screens.

## Guardrails
Feature branch, commit per step, no behavior regressions, respect
`prefers-reduced-motion`, and lazy-load Three.js only on the two glass surfaces.
