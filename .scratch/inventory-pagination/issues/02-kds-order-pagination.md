# Issue 02 — KDS Orders and History pagination

Status: ✅ DONE locally 2026-08-20 — verified in isolated slice, not deployed

## What to build

Paginate both the live KDS queue and Order History at ten records per page while
preserving realtime safety. Filtering and sorting occur before pagination and
their state is represented in the URL. New orders do not unexpectedly reshuffle
a later page, and bulk actions can affect only visible tickets.

## Acceptance criteria

- [x] Live Orders and History render at most ten matching records per page.
- [x] Tab, stage/filter, sort and page are URL-backed; filter/sort changes return
      to page 1 and invalid/empty pages clamp safely.
- [x] A vendor on a later live page receives a `new order — view page 1` notice
      rather than a disruptive page reshuffle.
- [x] Bulk selection/select-all is page-local and clears on page change.
- [x] Realtime status changes remove non-matching orders and safely clamp pages.
- [x] Total results and Previous/Page/Next controls are accessible and usable at
      mobile and desktop sizes.
- [x] Focused pagination/realtime tests plus the full verification gate pass.

## Blocked by

None — can start independently of Issue 01.

## Verification

- Focused pagination/date-filter tests: 10 passed.
- TypeScript and ESLint: clean.
- Full Vitest: 358 passed / 109 expected skips.
- Production Turbopack build: clean.
- Local webpack browser smoke: 390×844 and 1280×900 passed URL state,
  invalid-page clamping, accessible controls, ten-record History cap, zero
  horizontal overflow, zero framework overlays and zero console errors.
- Production, Vercel and migration `20260820183000_real_vendor_inventory` were
  not touched.
