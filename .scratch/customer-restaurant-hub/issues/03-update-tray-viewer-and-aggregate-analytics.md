# Issue 03 — Update tray, viewer and aggregate analytics

Status: ready-for-agent

## Parent

`.scratch/customer-restaurant-hub/PRD.md`

## What to build

Connect saved restaurants to a bounded public feed and deliver the three-day
tray, full-screen viewer and privacy-minimal engagement path. One ring represents
each Vendor, per-revision seen state stays local, and only displayed content is
cleared. Snapshot history remains intact while availability and `View menu` use
live truth. Vendors receive only aggregate batch opens and menu visits.

## Acceptance criteria

- [ ] A bounded feed accepts only deduplicated saved Vendor IDs and returns
      allowlisted public identity, active batches, current slug and availability.
- [ ] Suspended Vendors return unavailable identity with no updates; the feed is
      not a discovery/search endpoint.
- [ ] Hub counts separate new updates from total saved restaurants.
- [ ] Tray includes only active batches; unseen Vendors precede viewed and each
      group is newest-first without reordering the persistent list.
- [ ] One ring represents all active Vendor batches and correctly shows unseen/viewed.
- [ ] Viewer starts at newest unseen, marks only displayed revisions, preserves
      other unseen batches and supports explicit `Mark all as seen`.
- [ ] Snapshots, time, prices and `Currently unavailable` render correctly;
      `View menu` follows the live slug.
- [ ] Opens/menu visits increment aggregate counters at most once locally per
      revision without sending or storing customer identity/event history.
- [ ] Feed/privacy, ordering, seen state, viewer, analytics, accessibility and
      responsive tests pass.

## Blocked by

- Issue 01 — Unified customer app and saved restaurants
- Issue 02 — Automatic update batches and Vendor controls
