# ADR-0027: ZanTap brand assets across onboarding/KDS + darker textured KDS canvas

Date: 2026-07-01
Status: Accepted (candidate #16 polish — extends ADR-0025 wizard UI + ADR-0017 KDS dark theme)

## Context

Candidate #16 shipped the dark self-serve onboarding wizard (ADR-0025) using
emoji placeholders for the logo and the splash "role wheel," and the KDS
dashboard header (`MetricsBanner`) used an inline hexagon SVG placeholder. The
app had **no favicon** at all. The owner asked to use the real brand assets from
`design-assets/` and, separately, to make the KDS background slightly darker +
"texturized" and to simplify the SSE "reconnecting" indicator.

A first attempt wired the assets directly and rendered them tiny/invisible. Root
cause (measured via alpha bounding-box analysis): the source artwork fills only
~14–19% of its own canvas — the logo emblem and each role illustration carry
huge transparent padding baked into the file — so `object-contain` faithfully
shrank the real mark to a speck.

## Decision

1. **Assets are alpha-trimmed + downscaled into `public/brand/`, not referenced
   from `design-assets/`.** Next serves static files only from `/public` (which
   did not exist). A build step (PowerShell + System.Drawing) trims each asset to
   its opaque bounding box and re-exports tight PNGs: `zantap-logo.png` (the
   full-colour medallion from `zantap-logo-main.png`, 512²) and
   `public/brand/roles/{restaurant,customer,kitchen,mobile-money,delivery}.png`
   (256², ~6% padding). Rendered with `next/image`.

2. **The logo is the self-contained full-colour medallion** (not the flat
   gold/cream SVG, whose padded viewBox caused the tiny-render bug). Because it is
   a complete circular badge it needs no framing tile: header 56px, "You're Live"
   hero 96px (with the existing `zt-live-glow` halo), KDS `MetricsBanner` 40px.
   Role icons sit in 48px `bg-surface-strong` app-icon tiles with a hairline
   border so the transparent illustrations read as a cohesive set on the cards.

3. **Favicon via Next `app/` conventions, round + transparent.** `app/favicon.ico`
   (embedded 16/32/48), `app/icon.png` (256), `app/apple-icon.png` (180) are
   generated from the transparent medallion with a circular clip (corners removed)
   — no black-square background (the raw `favicon_io/android-chrome` assets had
   one). Owner chose the round transparent treatment over a tinted rounded-square
   tile.

4. **KDS canvas is `#0b0b0d` (a touch darker than the `#0e0e10` base) with a
   subtle film grain**, via a repeating SVG `feTurbulence` data-URI baked into a
   `background-image` (opacity ~0.05, 180px tile) — no extra asset, always paints
   behind content. Scoped to a new `.kds-surface` class (applied to the KDS shell
   + column in `KdsDashboard`) so the onboarding wizard's dark surface is
   unaffected. Rule lives in `globals.css` under the `.kds-dark` block.

5. **The SSE "reconnecting" indicator is a compact centered chip** — a CSS
   `animate-spin` loader ring + "Reconnecting…" — replacing the full-width card
   with the verbose "Live updates paused — queue may be stale" second line
   (`OrderTicket.tsx`, `OrdersList`).

## Consequences

- New committed binary assets under `public/brand/` + `app/` icons (small:
  logo 70 KB, icons 18–68 KB, favicon.ico 7 KB). Source `design-assets/` remain
  untracked working files.
- Brand is now consistent across splash, "You're Live", KDS header, and the
  browser tab / PWA / iOS icon.
- `next/image` is introduced (first use in the repo); the SVG path was avoided so
  no `dangerouslyAllowSVG` / `next.config` change was needed.
- The KDS grain is purely cosmetic and behind content; `bg-canvas`-tokened
  surfaces elsewhere are unchanged (scoped class).

## Alternatives considered

- **Fix the logo SVG's padded viewBox** — brittle to compute; the trimmed
  full-colour medallion PNG is simpler and higher-contrast on dark.
- **Tinted rounded-square favicon tile** (better legibility at 16px) — rejected;
  owner chose round + transparent.
- **Pseudo-element grain overlay** — risked painting above positioned KDS content
  (sticky header, tabs); a `background-image` guarantees it stays behind content.
