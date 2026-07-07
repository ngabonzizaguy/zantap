# Issue 03 — CheckoutSheet + ManualMomoSheet + StickyCartBar + SuccessReceipt

Status: **done** (2026-07-07)

Parent: Candidate #10 · ADR-0041

## Scope

Migrate checkout/cart/success surfaces from `zt-*` blush-glass to ElevenLabs
`DESIGN.md` tokens. Checkout orchestration, MoMo USSD logic, and cart behavior
unchanged.

## Files

- [x] `components/customer/CheckoutSheet.tsx` — editorial bottom sheet, `Input` primitive, MoMo-branded pay CTA
- [x] `components/customer/ManualMomoSheet.tsx` — `Button` primary/outline, hairline sheet shell
- [x] `components/customer/StickyCartBar.tsx` — ink pill CTA, surface-card bar
- [x] `components/customer/SuccessReceipt.tsx` — light canvas + `GradientOrbs`, success accent, `Button` CTAs

## Acceptance

- [x] Four components: zero `zt-*` (except `zt-hidescroll` on scroll containers)
- [x] `Input` / `Button` primitives used where applicable
- [x] MoMo pay button retains gold gradient branding (`momo`/`gold` tokens — not deprecated)
- [x] Checkout stage machine, sector picker API, manual USSD handlers unchanged
- [x] `npm run build` clean

## Out of scope

`MenuItemCustomizeSheet` — Issue 04
Deploy / prod curl smoke — after Issue 04 or incremental deploy
