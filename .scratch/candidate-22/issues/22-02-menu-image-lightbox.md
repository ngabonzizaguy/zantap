# Issue 22-02 — Menu image lightbox

Status: **Done** · Priority: 2 · Boundary: customer UI only
Feature: candidate #22 · supersedes ADR-0018 lightbox deferral

## Goal

Tapping a menu item photo opens a full-screen modal for visibility. Tapping card
body still opens the customize sheet.

## What to build

- New `MenuImageLightbox` (or extend carousel): full-bleed image, swipe between
  gallery URLs, dot/count indicator, close via X / backdrop / Escape.
- `MenuItemCard`: thumb tap `stopPropagation()` → open lightbox; card `onClick`
  unchanged for name/price area.
- Single-image items also openable from thumb.
- Reuse `Modal` primitive where sensible; keep legacy `zt-*` on customer route.

## Files

| Area | Paths |
|------|-------|
| UI | `components/customer/MenuImageLightbox.tsx` (new), `MenuItemImageCarousel.tsx`, `MenuItemCard.tsx` |
| Helper | `lib/menu/media.ts` (`getMenuItemGalleryUrls` — no change expected) |

## Acceptance

- [x] 2+ images: swipe in lightbox; indicator updates
- [x] Thumb tap does not open customize sheet
- [x] Card tap (non-thumb) still opens customize sheet
- [x] Escape / backdrop / X close lightbox
- [x] `npm run build` clean

## Out of scope

Pinch-zoom, download, share individual photos.

## Blocked by

Nothing.

## Unblocks

22-03 (independent).
