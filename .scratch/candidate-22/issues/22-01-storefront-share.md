# Issue 22-01 — Storefront share

Status: **Done** · Priority: 1 · Boundary: customer UI only
Feature: candidate #22

## Goal

Customer on `/{vendor-slug}` can share the storefront via native share sheet or
copy-link fallback.

## What to build

- Pass `slug` + `restaurantName` into `Hero` from `Storefront`.
- Wire share button: `getStorefrontUrl(slug)` + pattern from `LiveStep.shareStore`.
- `navigator.share({ title, text, url })` when available; else clipboard copy.
- Brief copied state on fallback (match onboarding).

## Files

| Area | Paths |
|------|-------|
| UI | `components/customer/Hero.tsx`, `components/customer/Storefront.tsx` |
| Seam | `lib/base-url.ts` (`getStorefrontUrl`) — already exists |

## Acceptance

- [x] Mobile: share sheet opens with storefront URL
- [x] Desktop / no Web Share API: copies URL to clipboard
- [x] Call button unchanged
- [x] `npm run build` clean

## Blocked by

Nothing.

## Unblocks

22-02 (independent).
