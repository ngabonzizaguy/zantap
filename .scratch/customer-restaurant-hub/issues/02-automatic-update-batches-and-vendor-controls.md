# Issue 02 — Automatic update batches and Vendor controls

Status: done locally · migration authored and validated but not applied · not deployed

## Parent

`.scratch/customer-restaurant-hub/PRD.md`

## What to build

Deliver the Vendor-to-Store publication path. Qualifying owner-token-guarded
menu/profile saves create or revise immutable public snapshots, consolidate
inside a rolling 20-minute batch, and expire three days after the latest
revision. Vendors can globally disable updates, suppress one save, preview the
active batch and see aggregate counters in the KDS. Operational changes stay
silent, suspended Vendors publish nothing, and both Store adapters agree.

## Acceptance criteria

- [x] Both Store adapters persist settings, batches, entries, monotonic revisions
      and aggregate counters behind the shared contract.
- [x] New dishes, image changes, price changes, restored dishes and public
      profile/branding changes qualify; normalized no-ops do not.
- [x] Availability/Stock, Inventory, archive, Order/payment/KDS activity and
      dish name/description-only edits do not publish.
- [x] First change publishes immediately; changes within 20 minutes revise the
      batch; later changes create a new batch.
- [x] Repeated subject/type edits retain first old and latest current values,
      increment revision, and expire three days after the latest revision.
- [x] Snapshots contain only approved public viewer fields.
- [x] Updates default on; global off and per-save `Don't announce` work through
      existing owner-token guards.
- [x] KDS exposes active-batch preview and aggregate counts without changing its PWA.
- [x] Any missing-owner-access notice used by these controls provides a direct
      button that opens the recovery input dialog in place; the Vendor must not
      have to detour through Setup Guide or another page.
- [x] Owner-access copy uses short, everyday Vendor language (for example,
      `Unlock editing` and `Enter your store link and signup phone`) and avoids
      implementation terms such as `owner token`.
- [x] Suspended Vendors and seed/migration paths do not publish.
- [x] Migration review, contracts, actions, KDS interactions, accessibility,
      TypeScript, lint, full tests and build pass locally; production is untouched.

## Blocked by

None — can start independently of Issue 01.

## Locked owner-access UX follow-up

Owner decision 2026-08-21 (ADR-0065): Issue 02 must reuse one direct recovery
dialog entry point anywhere its KDS controls discover missing owner access.
The same interaction should be reusable by the existing Menu, Inventory and
History notices so Vendors can open the inputs immediately instead of being
sent through Setup Guide. Setup may retain its access section as a secondary
route, but it is not the required path. Keep the explanation brief and plain.

## Completion evidence

- Store seam and both adapters now own default-on settings, immutable public
  entries, rolling 20-minute batches, three-day expiry, consolidation,
  monotonic batch revisions and aggregate counters. Migration
  `20260821220000_vendor_update_batches` was authored, formatted and validated;
  it was deliberately not applied.
- Owner-token-guarded menu/profile/branding actions publish only qualifying
  normalized changes. Availability, Stock, Inventory, archive and operational
  paths remain silent. KDS Menu exposes the global switch, one-save suppression,
  active preview and aggregate counts.
- ADR-0065 is implemented through one KDS-owned recovery dialog. Customer
  Updates, Menu, Inventory and History notices open it directly with `Unlock
  editing`, store-link and signup-phone language. Recovery updates every mounted
  owner-access hook on the same device.
- Local mobile Playwright verification at 390×844: KDS HTTP 200, no framework
  overlay or horizontal overflow; global on/off round-trip PASS and restored on;
  direct recovery dialog plus Menu/Inventory/History entry points PASS. The
  stale pre-change dev Store singleton found during the check is now detected
  and replaced safely by the Store factory.
- `npx tsc --noEmit`: clean; `npm run lint`: clean; `npm test`: 388 passed / 113
  skipped (the remote `#prisma` contract remains opt-in and was not run because
  applying the new migration was not authorized); `npm run build`: clean;
  `npx prisma validate`: clean.
- Issues 03–04 remain untouched. No migration was run/applied; no deployment,
  production smoke or push occurred.
