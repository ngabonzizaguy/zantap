# Issue 02 — Automatic update batches and Vendor controls

Status: ready-for-agent

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

- [ ] Both Store adapters persist settings, batches, entries, monotonic revisions
      and aggregate counters behind the shared contract.
- [ ] New dishes, image changes, price changes, restored dishes and public
      profile/branding changes qualify; normalized no-ops do not.
- [ ] Availability/Stock, Inventory, archive, Order/payment/KDS activity and
      dish name/description-only edits do not publish.
- [ ] First change publishes immediately; changes within 20 minutes revise the
      batch; later changes create a new batch.
- [ ] Repeated subject/type edits retain first old and latest current values,
      increment revision, and expire three days after the latest revision.
- [ ] Snapshots contain only approved public viewer fields.
- [ ] Updates default on; global off and per-save `Don't announce` work through
      existing owner-token guards.
- [ ] KDS exposes active-batch preview and aggregate counts without changing its PWA.
- [ ] Suspended Vendors and seed/migration paths do not publish.
- [ ] Migration review, contracts, actions, KDS interactions, accessibility,
      TypeScript, lint, full tests and build pass locally; production is untouched.

## Blocked by

None — can start independently of Issue 01.
