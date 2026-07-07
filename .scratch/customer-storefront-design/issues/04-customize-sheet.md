# Issue 04 — MenuItemCustomizeSheet

Status: **done** (2026-07-07)

Parent: Candidate #10 · ADR-0041

## Scope

Migrate the item customization bottom sheet from `zt-*` blush-glass to ElevenLabs
`DESIGN.md` tokens. Customize/add-to-order logic, ingredient toggles, notes, and
drag-to-dismiss behavior unchanged.

## Files

- [x] `components/customer/MenuItemCustomizeSheet.tsx` — editorial sheet shell, `Card`/`Badge`/`Button` primitives, ink typography

## Acceptance

- [x] Zero `zt-*` palette tokens (except `zt-hidescroll` on scroll containers)
- [x] `GlassPanel` replaced with `Card`; `Badge` for Optional/Included/Removed
- [x] Qty stepper + Add to order CTA match CheckoutSheet / StickyCartBar ink pill pattern
- [x] Ingredient rows, notes textarea, footer CTA use `hairline`/`surface`/`primary` tokens
- [x] Customize selection, totals, drag dismiss unchanged
- [x] `npm run build` clean

## Out of scope

Deploy + prod curl smoke — next session (all #10 Issues 01–04 ready locally)
