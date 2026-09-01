# Stage 1 — KDS visual-guide foundation and order walkthrough

Status: done · local verification complete 2026-09-02 · awaiting owner review before Stage 2

## Parent

`.scratch/kds-storefront-ops-improvements/issue-00-discovery.md` — Questions 9
and 10.

## What to build

Deliver the first complete Visual guide as a tracer through the existing KDS
education surfaces. A Vendor can open `Move an order through the kitchen` from
Kitchen help, move through four short frames, close or replay it, and use the
final `Show me` action to return to the live Orders surface.

The guide uses authentic KDS screenshots kept large and recognizable. Its
title, progress, Close control, one restrained warm-orange callout, one short
instruction, and Back/Next actions are accessible interface elements layered
over the screenshot—not generated text or buttons baked into a bitmap. The
owner-approved preview is the composition reference:
`C:\Users\G\.codex\generated_images\01a04613-b147-7470-a459-555c3fd7a924\exec-f5a4dd90-08be-44f9-a9bc-60db40039f2b.png`.

The four frames teach the real operational path: acknowledge a NEW paid order,
move it through PREPARING and READY, dispatch it to OUT FOR DELIVERY, and mark
it COMPLETED. Completion/dismissal is remembered per Vendor and device, while
Kitchen help always keeps the guide replayable. This stage establishes the
reusable guide definition, viewer behavior, screenshot/callout composition and
completion seam that Stage 2 will extend.

## Acceptance criteria

- [x] Kitchen help offers `Move an order through the kitchen` and opens one
  full-screen, responsive Visual guide without adding a new KDS tab.
- [x] The guide contains four ordered frames covering NEW/ACCEPTED,
  PREPARING, READY/dispatch, and OUT FOR DELIVERY/COMPLETED.
- [x] Every frame uses an authentic KDS screenshot with exactly one restrained
  warm-orange callout and one short plain-English instruction.
- [x] Title, `N of 4`, Close, Back, Next and final `Show me` are real accessible
  controls layered over the image; no generated text/button raster is shipped.
- [x] Back/Next boundaries, keyboard operation, focus handling, Close and
  reduced-motion behavior work on mobile and desktop.
- [x] The final `Show me` action closes the guide, opens Orders and makes the
  relevant live order workflow discoverable without mutating an order.
- [x] Completion/dismissal is stored per Vendor and device; the guide remains
  replayable from Kitchen help.
- [x] Focused automated coverage proves navigation, persistence isolation by
  Vendor, replay, Close, and `Show me`; headed mobile and desktop QA confirms
  the approved composition and reports no application console errors.

## Blocked by

None — can start immediately.

## Verification record

- Focused Visual guides tests: 3/3 passing.
- Full suite: 463 passing / 117 expected skips.
- Scoped ESLint, TypeScript and production build: passing.
- Headed browser QA: desktop plus 390×844 passed Help → all four frames →
  `Show me Orders`; the guide closed on the live Orders tab without mutating an
  order. The instruction and controls remain visible on mobile.
- Browser console: no application errors or warnings; the only warnings were
  emitted by an unrelated browser extension.
