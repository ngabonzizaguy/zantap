# Issue 03 — Update tray, viewer and aggregate analytics

Status: complete locally · browser-verified · release authorization pending

## Parent

`.scratch/customer-restaurant-hub/PRD.md`

## What to build

Connect saved restaurants to a bounded public feed and deliver the three-day
tray, full-screen viewer and privacy-minimal engagement path. One ring represents
each Vendor, per-revision seen state stays local, and only displayed content is
cleared. Snapshot history remains intact while availability and `View menu` use
live truth. Vendors receive only aggregate batch opens and menu visits.

## Acceptance criteria

- [x] A bounded feed accepts only deduplicated saved Vendor IDs and returns
      allowlisted public identity, active batches, current slug and availability.
- [x] Suspended Vendors return unavailable identity with no updates; the feed is
      not a discovery/search endpoint.
- [x] Hub counts separate new updates from total saved restaurants.
- [x] Tray includes only active batches; unseen Vendors precede viewed and each
      group is newest-first without reordering the persistent list.
- [x] One ring represents all active Vendor batches and correctly shows unseen/viewed.
- [x] Viewer starts at newest unseen, marks only displayed revisions, preserves
      other unseen batches and supports explicit `Mark all as seen`.
- [x] Snapshots, time, prices and `Currently unavailable` render correctly;
      `View menu` follows the live slug.
- [x] Opens/menu visits increment aggregate counters at most once locally per
      revision without sending or storing customer identity/event history.
- [x] Feed/privacy, ordering, seen state, viewer, analytics, accessibility and
      responsive tests pass.

## Completion note (2026-08-22)

Implemented the bounded Store-backed public feed in both adapters, private
revision/analytics markers in the existing IndexedDB/in-memory repository,
one-ring tray ordering, full-screen keyboard/touch viewer, explicit mark-all,
live availability/menu routing and aggregate-only analytics routes. Removing a
saved Vendor clears its local update markers. Verification: TypeScript and lint
clean; Vitest 396 passed / 114 skipped; production build clean. The attempted
local mobile/desktop browser smoke could not start because this repository does
not install `playwright` (`ERR_MODULE_NOT_FOUND`); a human walkthrough remains.
No migration, deployment, production smoke or push was performed. Issue 04
remains deferred.

## Browser gate follow-up (2026-08-22)

The in-app mobile/desktop walkthrough was attempted without changing source or
browser storage. It remains open for two local-environment reasons: Turbopack
rendered the shared `Icon` wrapper as `undefined` and fell into the global error
surface; the already-built production runtime rendered the KDS, but its Setup
drawer said the device was unlocked while the cached owner credential was
rejected by the fresh in-memory seed (`OWNER_TOKEN_INVALID`). Clearing local
browser data was not authorized, so no qualifying update fixture could be
published through the UI. No acceptance checkbox was changed. No migration,
deployment, production smoke or push was performed, and Issue 04 was not begun.

## Browser closeout (2026-08-22)

Owner authorization allowed the stale-access blocker to be resolved without
clearing unrelated site state: the KDS now validates a cached owner credential
against its Vendor on load, clears only an invalid credential and opens the
shared `Unlock editing` recovery dialog. A focused regression test covers valid
versus stale credentials. The Issue 03 effect also received the lint-safe empty-
feed state transition discovered by the full gate.

The production-mode local walkthrough passed on mobile and desktop: one ring
for the saved Vendor, revision reactivation, displayed revision seen state,
explicit mark-all, price snapshot plus `Currently unavailable`, keyboard close/
navigation, touch swipe handling, current-slug `View menu`, aggregate opens and
menu visits (`1`/`1`), zero responsive overflow and zero console errors. The
20-minute local batch window cannot naturally create multiple separate batches
during one walkthrough; deterministic unit/contract coverage remains the gate
for unseen-first multi-Vendor ordering, newest-unseen start and preservation of
undisplayed revisions. Final verification: 397 passed / 114 skipped, TypeScript,
lint and production build clean. No migration, deployment, production smoke or
push was performed. Issue 04 remains deferred.

## Blocked by

- Issue 01 — Unified customer app and saved restaurants
- Issue 02 — Automatic update batches and Vendor controls
