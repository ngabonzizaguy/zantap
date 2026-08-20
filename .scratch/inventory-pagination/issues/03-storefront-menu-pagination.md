# Issue 03 — Storefront menu pagination

Status: ✅ DONE locally 2026-08-20 — verified in isolated slice, not deployed

## What to build

Show at most ten available dishes per storefront page after category and search
filtering. URL-backed Previous/Page/Next navigation must preserve the cart,
support refresh/back/share, and return focus/scroll to the menu without making
customers lose their current selections.

## Acceptance criteria

- [x] At most ten available matching dishes render per page; unavailable dishes
      are excluded before counting.
- [x] Category, search and page are URL-backed; changes reset page to 1 and
      invalid pages clamp safely.
- [x] Previous/Page/Next controls work with browser Back, refresh and shared URLs.
- [x] Page changes preserve cart/customization state and scroll/focus to Menu.
- [x] Empty results, one-page menus, mobile and desktop layouts remain clear and
      accessible.
- [x] Focused URL/filter/pagination tests plus the full verification gate pass.

## Blocked by

None — can start independently of Issues 01 and 02.

## Verification

- Focused storefront URL/filter/pagination tests: 4 passed.
- TypeScript and ESLint: clean.
- Full Vitest: 362 passed / 109 expected skips.
- Production Turbopack build: clean.
- Local webpack browser smoke: 32/32 checks passed at 390×844 and 1280×900.
  It covered ten-card paging, shared/direct URLs, invalid-page clamping,
  category/search reset, browser Back, cart persistence, Menu focus/scroll,
  unavailable exclusion, empty results, accessible controls, zero horizontal
  overflow, zero framework overlays and zero console errors.
- Production, Vercel and migration `20260820183000_real_vendor_inventory` were
  not touched.
