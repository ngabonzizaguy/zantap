# Issue 02 — CategoryChips + MenuItemCard + carousel/lightbox

Status: **done** (2026-07-07)

Parent: Candidate #10 · ADR-0041

## Scope

Migrate menu browsing surfaces from `zt-*` blush-glass to ElevenLabs `DESIGN.md`
tokens. Cart, checkout, and customize sheet behavior unchanged.

## Files

- [x] `components/customer/CategoryChips.tsx` — primary pill active + hairline chips
- [x] `components/customer/MenuItemCard.tsx` — `Card` primitive, ink typography, primary add CTA
- [x] `components/customer/MenuItemImageCarousel.tsx` — hairline shell, `MenuItemPhotoStrip` tokens
- [x] `components/customer/MenuImageLightbox.tsx` — editorial frame + outline nav buttons

## Acceptance

- [x] CategoryChips / MenuItemCard / carousel / lightbox: zero `zt-*` (except `zt-hidescroll` utility)
- [x] `GlassPanel` + `glass-pill` removed from migrated files
- [x] Cart add/open/lightbox behavior unchanged (no Store/checkout edits)
- [x] `npm run build` clean

## Out of scope

Checkout sheets, StickyCartBar, SuccessReceipt — Issue 03
MenuItemCustomizeSheet — Issue 04
