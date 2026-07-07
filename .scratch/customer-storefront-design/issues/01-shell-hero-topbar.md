# Issue 01 — Storefront shell, TopBar, Hero, DescriptionClamp

Status: **done** (2026-07-07)

Parent: Candidate #10 · ADR-0041

## Scope

Migrate the customer page canvas and header stack from `zt-*` blush-glass to
ElevenLabs `DESIGN.md` tokens. No cart, checkout, menu cards, or Store changes.

## Files

- [x] `components/customer/Storefront.tsx` — `bg-canvas`, `GradientOrbs`, menu heading tokens
- [x] `components/customer/TopBar.tsx` — hairline/surface-card chips (drop `glass-pill`)
- [x] `components/customer/Hero.tsx` — `Card` primitive, editorial typography
- [x] `components/customer/DescriptionClamp.tsx` — ink/muted copy + more/less link

## Acceptance

- [x] `/[slug]` renders on `bg-canvas` with `GradientOrbs` (match `SuspendedStorefront`)
- [x] Hero/TopBar/DescriptionClamp: zero `zt-*` class names (`zt-hidescroll` utility name only on shell scroll container)
- [x] `npm run build` clean
- [x] Storefront still 200; checkout/MoMo untouched (not in this slice)

## Out of scope

CategoryChips, MenuItemCard, sheets, success receipt — Issue 02+
