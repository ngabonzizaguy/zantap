# Issue 01 — Immersive editorial hero

**Status:** In progress (branch `feat/storefront-hero-editorial`, build green)  
**Label:** ready-for-agent

## Goal

Redesign the storefront hero: full-bleed cover, gradient dissolve, glass logo/actions, vendor metadata on page surface.

## Checklist

- [x] Remove `Card` wrapper from `Hero.tsx`
- [x] Full-bleed cover at ~36vh with bottom fade into `bg-canvas`
- [x] Atmospheric overlay + blur for readability
- [x] Glass floating logo (lower-left, overlaps content)
- [x] Glass floating call + share (upper-right)
- [x] Vendor name / tagline / meta pills on page surface
- [x] `TopBar` composed inside hero via `header` prop
- [x] `npm run build` clean
- [ ] Deploy to Vercel Production
- [ ] Visual prod smoke (with + without cover image)

## Files

- `components/customer/Hero.tsx`
- `components/customer/Storefront.tsx`
- `docs/adr/0043-storefront-immersive-hero.md`
