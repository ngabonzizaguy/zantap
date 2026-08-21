# Issue 02 — KDS Orders and History pagination

Status: ✅ DONE · deployed 2026-08-20 · prod-smoked 2026-08-21

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
- Combined release 2026-08-20: deployed once as
  `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` on `zantap.app`. Orders and History paging
  URLs return HTTP 200; release-window error/fatal/5xx scans are empty. The
  complete browser interaction smoke is still pending because the shared
  disposable-fixture harness stopped earlier at an Inventory render-timing
  assertion before reaching these steps; no product error was observed.
- Final-smoke attempt 2026-08-20 again stopped at the preceding Inventory
  refresh assertion, so Orders page two, History page two and invalid-page
  interaction checks remain pending. The fixture cleanup is zero and deployment
  error/fatal/5xx scans are empty; no migration or redeploy occurred.
- Follow-up single run 2026-08-20 reached Live Orders page 2 and rendered its
  `Page 2 of 2` state, but the harness counted `<article>` elements even though
  `OrderTicket` uses the shared div-rooted `Card`; it therefore reported zero
  instead of the expected two tickets. The selector now counts the direct
  ticket cards and was not rerun. History page two and invalid-page checks remain
  pending. Cleanup is zero and deployment error/fatal/5xx scans are empty.
- Ticket-selector follow-up 2026-08-20 passed Live Orders page two with exactly
  two remaining tickets, URL-backed Previous to page one, History page two with
  two receipts, and invalid `historyPage=999` clamping to page two. The shared
  run later stopped at storefront Previous behavior, so combined candidate
  closeout remains pending. Cleanup and deployment scans are clean.
- Final combined production smoke 2026-08-21: the single authorized harness run
  passed Live Orders page two with two tickets, Previous to page one, History
  page two with two receipts, and invalid-page clamping. Independent cleanup
  verified zero `release-25-*` fixtures across all owned tables, and deployment
  `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` returned zero error, fatal and 5xx logs over
  the 48-hour scan. No migration was reapplied and no redeploy occurred.
- Main integration 2026-08-21: `7028e5b` was fast-forwarded to `main` and
  deployed as `dpl_874DQNUcV2fG7eXsbtLeFTqdeJJd` at `zantap.app`. KDS routes
  return HTTP 200 and the initial exact-deployment error scan is empty. The
  migration and 27-check production harness were not repeated.
