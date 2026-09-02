# Stage 1 — First-run `Become ready to receive orders` guide

Status: ready-for-agent · owner-approved redesign 2026-09-02 · implement in a separate session

## Parent

`.scratch/kds-storefront-ops-improvements/issue-00-discovery.md` — Questions 9
and 10.

## Superseded local tracer

Commit `85e3091` implemented and verified a four-frame
`Move an order through the kitchen` screenshot carousel. The implementation is
local only and must not be deployed in its current form: owner review determined
that order progression is not the main first-run operation. Reuse sound
accessibility/viewer/persistence seams where useful, but replace the first-run
subject and UI with the approved readiness flow below.

## Exact visual reference

Keep the approved three-screen composition, hierarchy, copy, dark KDS styling,
checklist order, actions and completion state intact:

`C:\Users\G\.codex\generated_images\01a05eed-040b-77c3-96d8-7ca58625e0df\exec-eaf121ea-6bcb-4dea-b661-fea903b914a3.png`

The generated bitmap is a decision reference, not a shipping asset. Build the
modal with real accessible UI and authentic product state.

## What to build

On a new Vendor's first incomplete KDS visit, show one modal over the dimmed
dashboard:

- `Welcome to your kitchen`
- `Let's make sure you're ready to receive orders.`
- primary `Guide me`
- secondary `I'll do it myself`
- a clear close icon
- quiet copy explaining that the guide is always available again from Kitchen
  help.

`Guide me` opens the exact checklist overview from the reference:

1. Storefront details
2. Available menu
3. Payment setup
4. Kitchen status

Each row uses current Vendor data and may be completed in any order. The visual
sequence and suggested next incomplete item remain Storefront → Menu → Payment
→ Kitchen. Begin at the checklist overview, not inside the first detail step.

The completed screen retains the approved `You're ready for orders`, all four
checks, `OPEN · LIVE`, `Go to Orders`, `Review setup`, and Help replay cue.

## First-run and close semantics

- Auto-show only when readiness is incomplete and this Vendor/device has no
  stored choice.
- If the Vendor is already fully ready, do not auto-show, including on a new
  device.
- `Guide me` records the choice and the guide never auto-opens again on that
  device.
- `I'll do it myself` immediately stops all future automatic appearances on
  that Vendor/device.
- The first close-icon dismissal means `not now`; if readiness is still
  incomplete, offer the modal once more on the next KDS visit.
- A second close-icon dismissal stops future automatic appearances on that
  Vendor/device.
- Manual replay from Kitchen help is always available, regardless of choice,
  close count or completion.
- This modal replaces the current first-load Setup drawer/coachmark opening;
  never stack education overlays.

## Acceptance criteria

- [ ] The first incomplete KDS visit shows the exact approved welcome modal and
  offers `Guide me`, `I'll do it myself`, Close and an unobtrusive Help replay
  explanation.
- [ ] `Guide me` opens the approved four-row readiness checklist overview.
- [ ] Readiness derives from live Vendor/menu/payment/kitchen data; already-ready
  Vendors never receive the automatic modal.
- [ ] Choice and two-dismissal behavior are versioned and isolated per Vendor
  and device.
- [ ] No Setup drawer, coachmark or second guide overlay stacks with the modal.
- [ ] Kitchen help provides a clear, permanent replay entry without obstructing
  ordinary KDS work.
- [ ] The approved complete state offers `Go to Orders` and `Review setup`.
- [ ] Accessible focus, keyboard, Close, reduced-motion and 390×844/desktop
  behavior are verified with no application console errors or overflow.
- [ ] Focused tests cover readiness derivation, Vendor/device isolation, first
  and second Close, both initial choices, already-ready suppression and replay.

## Blocked by

None — owner interview is complete. Implement only in the next session.
