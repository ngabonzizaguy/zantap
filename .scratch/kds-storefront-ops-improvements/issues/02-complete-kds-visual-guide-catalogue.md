# Stage 2 — Contextual readiness steps and unobtrusive return flow

Status: in-progress · implementation authorized and started 2026-09-04 · local only

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

- [x] Every row opens a short contextual step with current state, reason, one
  authentic annotated screenshot, Back and Show/View action.
- [x] Completed rows remain tappable and say `View setup`.
- [x] `Show me` closes the modal, navigates to the correct live surface and
  highlights the target without performing the action.
- [x] One compact `Return to guide` chip remains visible without covering KDS
  controls; it becomes `Done — continue guide` when live state completes.
- [x] Returning refreshes the checklist and recommends the next incomplete row
  in Storefront → Menu → Payment → Kitchen order.
- [x] Kitchen opening warns rather than blocks when Menu or Payment is
  incomplete.
- [x] Payment status masks its destination and exposes no token or full
  sensitive credential.
- [x] Help replay opens the same intact flow at any time and does not re-enable
  automatic first-run appearances.
- [ ] Focused tests cover every row destination, live refresh, chip states,
  warning behavior and masking; mobile/desktop headed QA reports no overlap,
  overflow or application console errors.

## Blocked by

None. The actionable Stage 1 was approved locally on 2026-09-02. Stage 2 still
requires a separate implementation session and explicit authorization; this
approval session did not begin it.

The earlier broad five-guide catalogue is deferred. Do not implement the order,
Stock or customer-update screenshot catalogues until the owner separately
prioritizes them after this readiness flow is reviewed.

## Implementation start — 2026-09-04

The owner explicitly authorized Stage 2 after releasing Stage 1. The first
local slice is implemented: every readiness row now opens a contextual view
inside the existing modal frame with live status, short reason, one authentic
repository product screenshot, a live annotation, Back, and Show/View action.
Completed rows remain tappable. Payment displays only payout type plus the last
four characters; Kitchen warns about incomplete Menu/Payment without blocking.
The real-control handoff retains the Stage 1 destination/highlight behavior and
uses the approved `Return to guide` / `Done — continue guide` chip.

Verification: focused 12/12, full 482 passed / 117 skipped, TypeScript, scoped
ESLint, production build and diff hygiene pass. Headed local Help → guide →
completed Payment context → View setup → Done return passed; 390×844 and
1440×1000 contextual renders fit with zero application console errors.
Evidence is under `output/playwright/kds-readiness-stage2/` and remains
untracked with the preserved output tree.

The final acceptance checkbox remains open for a dedicated incomplete-state
browser walkthrough of every destination, live completion/chip transition and
Kitchen warning. This Stage 2 slice is local only and must not be pushed or
deployed without a new owner release decision. Question 11 and the Marketing
Lead Form remain untouched.
