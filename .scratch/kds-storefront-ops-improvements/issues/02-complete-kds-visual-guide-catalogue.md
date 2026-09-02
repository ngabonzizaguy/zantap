# Stage 2 — Contextual readiness steps and unobtrusive return flow

Status: ready-for-agent · owner-approved design 2026-09-02 · start after revised Stage 1

## Parent

`.scratch/kds-storefront-ops-improvements/issue-00-discovery.md` — Questions 9
and 10.

## What to build

Make every readiness row in the Stage 1 checklist useful without turning it
into another long carousel. Tapping a row opens one short contextual step that
shows:

- current live status;
- why the item matters to receiving orders;
- one authentic annotated product screenshot;
- `Back to checklist`;
- `Show me` (or `View setup` for an already-complete row).

`Show me` closes the modal and navigates to/highlights the real KDS control. It
never completes an action for the Vendor. A compact, unobtrusive `Return to
guide` chip stays available while they work. After the relevant live state
becomes complete, the chip changes to `Done — continue guide`; returning updates
the checklist and suggests the next incomplete row. The full modal never
reopens automatically.

## Row contracts

1. **Storefront details** — show live completeness for logo, cover,
   description, location and phone; open the Storefront/Setup editor and allow
   the Vendor to preview what Customers see.
2. **Available menu** — show available-dish count and missing basics; open Menu,
   Add Item or a specific incomplete dish.
3. **Payment setup** — show payout-method status and only a masked destination;
   open Setup/Payments. Never expose a token or full sensitive credential.
4. **Kitchen status** — explain CLOSED versus OPEN customer impact and
   open/highlight the header toggle. Opening completes this row.

Opening the kitchen remains possible when Menu or Payment is incomplete, but
show a clear warning rather than hard-blocking the Vendor.

## Exact visual reference

Preserve the Stage 1 reference's modal frame, typography, dark styling,
checklist order and action hierarchy:

`C:\Users\G\.codex\generated_images\01a05eed-040b-77c3-96d8-7ca58625e0df\exec-eaf121ea-6bcb-4dea-b661-fea903b914a3.png`

Contextual views extend that UI; they must not visually redesign it. Authentic
screenshots and annotations are real layered UI, not generated raster controls.

## Acceptance criteria

- [ ] Every row opens a short contextual step with current state, reason, one
  authentic annotated screenshot, Back and Show/View action.
- [ ] Completed rows remain tappable and say `View setup`.
- [ ] `Show me` closes the modal, navigates to the correct live surface and
  highlights the target without performing the action.
- [ ] One compact `Return to guide` chip remains visible without covering KDS
  controls; it becomes `Done — continue guide` when live state completes.
- [ ] Returning refreshes the checklist and recommends the next incomplete row
  in Storefront → Menu → Payment → Kitchen order.
- [ ] Kitchen opening warns rather than blocks when Menu or Payment is
  incomplete.
- [ ] Payment status masks its destination and exposes no token or full
  sensitive credential.
- [ ] Help replay opens the same intact flow at any time and does not re-enable
  automatic first-run appearances.
- [ ] Focused tests cover every row destination, live refresh, chip states,
  warning behavior and masking; mobile/desktop headed QA reports no overlap,
  overflow or application console errors.

## Blocked by

- Revised `.scratch/kds-storefront-ops-improvements/issues/01-kds-visual-guide-foundation.md`

The earlier broad five-guide catalogue is deferred. Do not implement the order,
Stock or customer-update screenshot catalogues until the owner separately
prioritizes them after this readiness flow is reviewed.
