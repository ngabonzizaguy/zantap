# ADR-0018: Storefront menu image carousel

Date: 2026-06-27
Status: Accepted

## Context

ADR-0008 captured multi-image gallery data on `MenuItem`; the customer storefront
still showed only the primary image via `getPrimaryImageUrl`. Vendors upload up to
six photos in the KDS menu editor (candidate #6).

## Decision

- Add `getMenuItemGalleryUrls(item)` in `lib/menu/media.ts` — sorted gallery URLs
  with legacy `imageUrl` fallback.
- New `MenuItemImageCarousel` client component: native horizontal scroll +
  `scroll-snap` when `urls.length >= 2`; static thumb for 0–1 URLs; dot indicators
  synced via scroll + `ResizeObserver`.
- Wire into `MenuItemCard` only; qty badge stays on the outer `relative` wrapper.
- **No new npm deps**, no Store/schema changes.
- **Keep legacy `zt-*` blush-glass** on customer route — DESIGN.md migration remains
  candidate #10 (owner-deferred).

## Consequences

- Instagram/TikTok traffic can swipe dish angles before ordering.
- KDS cards unchanged (still primary image).
- Lightbox / pinch-zoom out of scope.
