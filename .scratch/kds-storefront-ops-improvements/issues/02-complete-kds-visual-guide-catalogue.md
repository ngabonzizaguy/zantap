# Stage 2 — Contextual readiness steps and unobtrusive return flow

Status: done · owner-authorized release · deployed and production-smoked 2026-09-08

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
- [x] Focused tests cover every row destination, live refresh, chip states,
  warning behavior and masking; mobile/desktop headed QA reports no overlap,
  overflow or application console errors.

## Blocked by

None. Stage 2 implementation, local browser acceptance, and owner-authorized
production release are complete. Historical gates below describe earlier sessions.

The earlier broad five-guide catalogue is deferred. Do not implement the order,
Stock or customer-update screenshot catalogues until the owner separately
prioritizes them after this readiness flow is reviewed.

## Implementation start — 2026-09-04

The owner explicitly authorized Stage 2 after releasing Stage 1. The first
local slice is implemented at commit `9772439`: every readiness row now opens a contextual view
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

At implementation start, the final acceptance checkbox remained open for a
dedicated incomplete-state browser walkthrough of every destination, live
completion/chip transition and Kitchen warning. The gate is now closed by the
walkthrough below. This Stage 2 slice is local only and must not be pushed or
deployed without a new owner release decision. Question 11 and the Marketing
Lead Form remain untouched.

## Dedicated incomplete-state browser gate — 2026-09-05

The final gate passed against a disposable in-memory Vendor created through the
real onboarding flow. Its storefront lacked logo, cover, description and
location; its single dish was made sold out; payment remained complete; and the
kitchen was closed. Storefront, Menu, Payment and Kitchen each opened the live
contextual view and navigated to/highlighted the intended real control. The
Payment view exposed only `Merchant code •••3456`.

Live Menu state changed `0 of 1 items live` → `1 of 1 items live` and the chip
changed `Return to guide` → `Done — continue guide`; reversing availability
reversed the chip. Kitchen context warned, “finish your menu so customers can
order successfully,” while OPEN remained available. Opening the kitchen changed
the Kitchen chip to `Done — continue guide` without a hard block.

Headed Playwright at 390×844 and 1440×1000 reported exact client/scroll widths
for the contextual modal and document, zero chip intersections with visible
buttons/links/inputs, and zero console errors or warnings. Evidence is preserved
under `output/playwright/kds-readiness-stage2/`, including
`incomplete-kitchen-warning-mobile.png`,
`incomplete-kitchen-warning-desktop.png`, and `kitchen-done-chip-mobile.png`.
No source change was required. Stage 2 is complete locally but unpushed and
undeployed pending explicit owner release approval. Question 11 and the
Marketing Lead Form remain untouched.

## Production release — 2026-09-08

- [x] Owner authorized release in this session. Verified origin at `9dc87fa`,
  with exactly `9772439` (Stage 2 product/tests and continuity) and `3337db5`
  (documentation) pending. Runtime changes are confined to the readiness guide;
  no Prisma/schema, Marketing Lead Form, or Question 11 changes.
- [x] Read-only migration status against documented Production project
  `vzhauguzvhdlpwvqhsfo`: all 22 migrations current. Vercel env pull redacted
  DATABASE_URL/DIRECT_URL to empty values, so the successful check used the
  existing main-checkout direct connection. No migration or seed was run.
- [x] Focused tests 12/12; full suite 482 passed / 117 expected skips;
  TypeScript, scoped ESLint, diff hygiene, and Vercel production build pass.
- [x] Pushed exact `9dc87fa..3337db5` to `codex/candidate-29`; deployed from
  clean detached checkout `zantap-release-stage2-20260908`, exact full SHA
  `3337db5e5598ae7c2b9e53ceb36481a4b2904dde`.
- [x] Deployment `dpl_FWg1wrFxKR5pKTRJbfoZxjRQPPTo` READY, aliased to
  `https://zantap.app`; immutable URL
  `https://zantap-g5ushkko8-ngabonziza-guys-projects.vercel.app`.
- [x] Production browser: welcome → Guide me → live 3-of-4 checklist; all four
  contextual views at 390×844 and 1440×1000 with decoded screenshots and no
  horizontal overflow; masked payment; all four Show/View destinations; complete
  rows produce Done chips and incomplete Storefront produces Return to guide;
  return restores checklist; Help replay works and reload does not auto-reopen.
- [x] KDS, storefront, `/restaurants`, `/menu-intake` HTTP 200; Ops intake 307
  to login; restaurants empty-state rendering passes. Exact-deployment scan:
  27 requests, zero error/fatal/warning/5xx entries. Browser errors: zero.
  Chrome unused-font-preload warnings were present before and after release;
  do not describe browser warnings as zero.

Production smoke was read-only for business data. Live availability/kitchen
transitions and warning-without-blocking remain covered by the 2026-09-05
disposable in-memory gate; no production fixture, import, profile save, kitchen
toggle, message, or token reissue was performed. Screenshots are preserved as
`output/playwright/kds-readiness-stage2/prod-*.png`; test/log evidence is under
`output/stage2-*20260908.*`. All pre-existing `.playwright-cli/` and `output/`
artifacts remain intact. The release checkout is retained for exact-commit audit.
