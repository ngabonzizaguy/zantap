# Issue 02 — KDS Orders and History pagination

Status: ready-for-agent

## What to build

Paginate both the live KDS queue and Order History at ten records per page while
preserving realtime safety. Filtering and sorting occur before pagination and
their state is represented in the URL. New orders do not unexpectedly reshuffle
a later page, and bulk actions can affect only visible tickets.

## Acceptance criteria

- [ ] Live Orders and History render at most ten matching records per page.
- [ ] Tab, stage/filter, sort and page are URL-backed; filter/sort changes return
      to page 1 and invalid/empty pages clamp safely.
- [ ] A vendor on a later live page receives a `new order — view page 1` notice
      rather than a disruptive page reshuffle.
- [ ] Bulk selection/select-all is page-local and clears on page change.
- [ ] Realtime status changes remove non-matching orders and safely clamp pages.
- [ ] Total results and Previous/Page/Next controls are accessible and usable at
      mobile and desktop sizes.
- [ ] Focused pagination/realtime tests plus the full verification gate pass.

## Blocked by

None — can start independently of Issue 01.
