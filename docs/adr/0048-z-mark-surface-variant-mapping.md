# ADR-0048: Z mark variant mapping per surface (dark tile vs transparent mark)

Date: 2026-08-05
Status: Accepted (implements ADR-0046 §4 brand rollout — issue 01 of the
restructure PRD; supersedes ADR-0027's medallion asset choices)

## Context

ADR-0046 §4 approves the black-and-amber Z (`public/brand/approved-z/`) as the
product-wide mark, replacing the circular food medallion (ADR-0027). The
approved set ships several variants; the issue left the per-surface mapping to
the implementing session. Measured constraints (alpha/color analysis, same
method as ADR-0027):

- `zantap-z-mark-{1024,2048}.png` — transparent, 85% near-black pixels:
  **invisible on the dark KDS/onboarding surfaces** (`.kds-dark`, `#0b0b0d`).
- `zantap-z-mark-white-2048.png` — monochrome white: reads on dark but loses
  the amber, the only brand color.
- `zantap-z-avatar-offwhite-1024.png` — opaque off-white tile with the
  full-color mark: reads on dark and keeps the amber.
- The mark's ink extends to ~78% of the canvas diagonal — a **circular crop of
  the avatar clips the Z's top-left corner**, so round treatment is not safe.
- `zantap-z-favicon-{32,64,180,512}.png` — opaque off-white square tiles,
  pre-composed for icon use.

## Decision

1. **Dark surfaces use the off-white avatar tile with rounded-square corners**
   (never `rounded-full`): onboarding splash header 56px `rounded-brand-lg`,
   "You're Live" hero 96px `rounded-brand-xxl` (inside the existing
   `zt-live-glow` pulse, which follows the element radius), KDS `MetricsBanner`
   40px `rounded-brand-md`. The tile keeps the amber accent; the white
   monochrome mark is reserved for future contexts where an opaque tile is
   unacceptable.
2. **Light surfaces use the transparent full-color mark directly**
   (`zantap-z-mark-1024.png`): ops console sidebar 32px, no tile, no radius.
3. **Favicon set uses the pre-composed opaque tiles as shipped**:
   `favicon-512` → `app/icon.png`, `favicon-180` → `app/apple-icon.png`, and
   `app/favicon.ico` packs the 32+64 PNGs as PNG-compressed ICO entries
   (builder: `.scratch/product-restructure/build-favicon-ico.mjs`). This
   supersedes ADR-0027's round-transparent favicon treatment — the approved-z
   tiles are square and opaque by design.
4. **The medallion is retired**, moved to
   `public/brand/proofs/rejected/zantap-logo-medallion.png`.
   `public/brand/zantap-logo-2.png` stays — it is the Z identity source the
   proofs docs reference, not a medallion.

## Consequences

- All four in-app logo usages (`SplashStep`, `LiveStep`, `MetricsBanner`,
  `OpsShell`) point at `public/brand/approved-z/`; nothing references the
  medallion.
- Browser tab / PWA / iOS icons show the off-white Z tile (visible on both
  light and dark browser chrome, unlike a transparent dark mark).
- Future dark-surface brand placements should reuse the avatar tile +
  rounded-square pattern; do not place the transparent black mark on
  `.kds-dark` surfaces and do not circular-crop the avatar.
