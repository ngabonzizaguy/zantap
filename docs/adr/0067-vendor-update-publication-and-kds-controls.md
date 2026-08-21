# ADR-0067 — Vendor update publication and KDS controls

Date: 2026-08-21
Status: Accepted · implemented locally in Candidate #26 Issue 02 · not deployed

## Context

Candidate #26 needs qualifying Vendor menu and storefront saves to become
small, temporary customer-facing update snapshots. Publication must stay
behind the Store seam, behave identically in memory and Postgres, avoid
operational data, require no delayed job, and give Vendors simple controls.
ADR-0065 additionally requires missing owner access to recover in place with
plain language.

## Decision

- Add default-on `updatesEnabled` state to Vendor and durable
  `VendorUpdateBatch` / `VendorUpdateEntry` records. A batch owns its revision,
  publication/expiry times, public snapshot entries and aggregate open/menu-
  visit counters.
- The first qualifying change publishes immediately. Another qualifying change
  within 20 minutes of the latest publication revises that batch; a later one
  starts a new batch. Every revision moves expiry to three days after that
  revision.
- Entries consolidate by batch, type and stable subject ID. Repeated price
  edits retain the first old price and latest current price. The persisted
  interface accepts only approved public fields: type, subject ID, name, image,
  old/current public price and concise profile summary.
- Pure publication functions compare normalized before/after MenuItem and
  Vendor values. New dishes, gallery/image changes, prices, restores and public
  profile/branding changes qualify. Descriptive-only dish edits, availability,
  Stock, Inventory, archive and operational activity do not.
- Existing guarded Server Actions pass an optional one-save announce policy to
  the Store. Store enforcement still blocks global-off, explicit suppression
  and suspended Vendors, so callers cannot accidentally bypass those rules.
- The KDS Menu tab owns the global switch, next-save suppression, active-batch
  preview and aggregate totals. KDS manifest/scope remain unchanged.
- One KDS-level `RecoverAccessDialog` is shared by Customer Updates, Menu,
  Inventory and History notices. `cacheOwnerToken` emits a same-tab access-
  changed event so mounted panels become editable immediately after recovery.
  Vendor copy says `Unlock editing`, `store link` and `signup phone`; it does not
  expose capability-token terminology.
- The Store factory feature-detects the current interface and replaces an
  outdated hot-reload singleton once. This preserves normal in-process state
  while preventing a development server retained across interface changes from
  serving an obsolete adapter.

## Consequences

- Both adapters expose one deep publication interface for this issue and the
  future bounded customer feed/analytics slice.
- Issue 03 can consume batches and increment counters without introducing a
  competing data path, but Issue 03 is not implemented here.
- The Prisma migration is authored and locally validated. It must be reviewed
  and applied only after explicit authorization; production remains unchanged.
- The remote Prisma contract suite remains opt-in until that migration gate.
