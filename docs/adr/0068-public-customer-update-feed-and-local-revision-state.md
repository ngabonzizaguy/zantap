# ADR-0068 — Public customer update feed and local revision state

Date: 2026-08-22
Status: Accepted · Issue 03 implemented locally · browser walkthrough pending · not deployed

## Context

Candidate #26 Issues 01–02 persist a private device-local restaurant list and
public Vendor update batches. Issue 03 must join those modules without turning
the feed into discovery, storing customer identity server-side, reordering the
persistent restaurant list, or leaking operational fields.

## Decision

- Add one bounded `Store.listPublicVendorUpdates(vendorIds, at)` interface in
  both adapters. It deduplicates and caps supplied stable Vendor IDs at 50,
  returns current public identity/slug plus active non-expired batches, and
  resolves current dish availability separately from immutable snapshots.
- Suspended Vendors retain public identity but return no batches. Missing IDs
  are omitted. Batch counters and private Vendor fields are not returned.
- Upgrade the existing customer IndexedDB to version 2 with an `updateStates`
  object store. The same repository interface owns viewed revision and
  aggregate-open/menu-visit sent revision markers; no direct component storage
  path is introduced. The in-memory adapter satisfies the same contract.
- Associate marker rows with stable Vendor ID so confirmed restaurant removal
  also clears that Vendor's local update state.
- Derive one tray ring per Vendor from active batches. Vendors with any unseen
  revision sort before fully viewed Vendors; each group sorts newest-first.
  This derived order never changes the persistent restaurant-list recency.
- The viewer begins at the newest unseen batch, marks a revision viewed only
  after it renders, supports touch and keyboard movement, and keeps explicit
  `Mark all as seen` separate.
- The browser sends an aggregate open or menu-visit only when the local sent
  revision is behind the displayed revision. The server increments only the
  batch aggregate and stores no customer/device/event record.

## Consequences

- A revised rolling batch becomes unseen and eligible for one new aggregate
  open/menu-visit from that device because revisions are monotonic.
- Aggregate figures remain directional: local storage loss can allow another
  increment and is intentionally not converted into server-side identity.
- Feed and analytics routes are `private, no-store`; Issue 04 will separately
  define approved offline read-model caching.
- No schema migration is required for Issue 03. Deployment and production
  smoke remain a separate owner-authorized gate.
