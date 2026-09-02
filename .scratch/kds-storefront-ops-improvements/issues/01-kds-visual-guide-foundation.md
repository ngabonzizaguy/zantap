# Stage 1 — First-run `Become ready to receive orders` guide

Status: ready-for-human · actionable-row revision implemented and verified locally 2026-09-02 · owner review pending

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

- [x] The first incomplete KDS visit shows the exact approved welcome modal and
  offers `Guide me`, `I'll do it myself`, Close and an unobtrusive Help replay
  explanation.
- [x] `Guide me` opens the approved four-row readiness checklist overview.
- [x] Readiness derives from live Vendor/menu/payment/kitchen data; already-ready
  Vendors never receive the automatic modal.
- [x] Choice and two-dismissal behavior are versioned and isolated per Vendor
  and device.
- [x] No Setup drawer, coachmark or second guide overlay stacks with the modal.
- [x] Kitchen help provides a clear, permanent replay entry without obstructing
  ordinary KDS work.
- [x] The approved complete state offers `Go to Orders` and `Review setup`.
- [x] Accessible focus, keyboard, Close, reduced-motion and 390×844/desktop
  behavior are verified with no application console errors or overflow.
- [x] Focused tests cover readiness derivation, Vendor/device isolation, first
  and second Close, both initial choices, already-ready suppression and replay.

## Blocked by

None — owner interview is complete.

## Implementation record — 2026-09-02

Revised Stage 1 replaces the local `85e3091` order-progression viewer. The KDS
now derives four live readiness rows, shows the approved accessible dark modal
only under the first-run rules above, permanently exposes replay from Kitchen
help, and keeps readiness, Setup, Help, recovery, and coachmark overlays mutually
exclusive. The versioned preference remains local per Vendor/device; no schema
or migration was added.

Verification is green: focused 6/6; full 466 passed / 117 skipped; canonical
TypeScript; scoped ESLint; production build; and headed 390×844 plus 1440×1000
interaction/visual QA with zero application console errors and no horizontal
overflow. QA covered both initial choices, first/second Close, Help replay, live
refresh into the complete state, already-ready suppression, `Go to Orders`, and
`Review setup`. Evidence remains under `output/playwright/kds-readiness-stage1/`.

Stage 2 is deliberately untouched and remains held until the owner reviews this
intact Stage 1 UI. Nothing was deployed, migrated, pushed, imported from Ops,
or changed in the Marketing Lead Form or Question 11.

## Owner review — CHANGES REQUIRED 2026-09-02

The owner rejected the intact Stage 1 checklist because its highlighted
incomplete row is only a status display. A Vendor with limited English or
technical knowledge cannot tell that the row is actionable, where the missing
information belongs, or what to do next.

Revise Stage 1 before approval:

- the recommended incomplete row must be an obvious keyboard-accessible and
  tappable control, not a passive yellow status row;
- the row must use short, plain action copy and a directional affordance so the
  Vendor understands that tapping it will help;
- activating it must explain the missing requirement and provide a direct path
  to the exact live KDS destination where the Vendor can complete it;
- completed rows may remain quieter but must still make their review behavior
  explicit if they are interactive;
- returning from the destination must preserve a clear path back to readiness.

This correction belongs to Stage 1 because the overview is not independently
useful without a next action. Stage 2 remains unstarted; do not broaden this
revision into all four contextual screenshot flows until the corrected Stage 1
is reviewed again.

## Actionability flow preview — OWNER REVIEW PENDING 2026-09-02

A second preview makes the proposed live-control handoff explicit:
`C:\Users\G\.codex\generated_images\01a060b7-f1d7-7fd2-a867-e3b9d6a768f1\exec-8c9b9a80-cb04-40e5-bec0-65362f3ceaff.png`.

The proposal reuses the existing Setup drawer rather than adding a competing
form or nested editor modal. `Show me where` opens and scrolls the real drawer;
the tappable `Start here` badge and its highlighted control group invoke the
same existing control. Branding uploads persist through the current upload
action; text remains incomplete until the existing `Save profile` succeeds.
Saved live data re-derives readiness, advances the highlight to the next missing
control, and updates the return chip. The completed chip and incomplete chip in
the preview are alternative states, never simultaneous shipping UI.

Owner response: the visual direction and proposed logic are accepted as the
exact implementation target. Formal implementation authorization is explicitly
deferred to another session. Do not edit Stage 1 until that later approval.

## Actionability implementation — 2026-09-02

The owner explicitly authorized implementation in the resumed session. The
recommended incomplete row is now a real keyboard-accessible button with plain
missing-state copy, `Show me where`, and a directional affordance. It routes to
the existing live KDS control—Setup storefront/payment, Menu Add, or the kitchen
toggle—without adding a nested editor or performing the Vendor's action.

The Setup drawer implements the accepted live handoff. Guided mode has the
clean `Setup` + return-chip header, scrolls the exact missing control to the top,
adds a tappable/keyboard `Start here` affordance, and highlights the real
control group. Branding uploads still persist through `uploadBrandingImage`;
location/description and the other profile fields still require their existing
save actions. The active task stores only the readiness row ID, so every saved
live update re-derives the next granular target and remaining count. Completion
removes the highlight and changes the chip to `Done — continue guide`; returning
opens the refreshed checklist rather than the welcome screen.

The same minimum loop covers Menu, Payment, and Kitchen without starting Stage
2's contextual screenshot views. Menu and Kitchen highlight their existing live
controls and use the same compact return chip; Payment opens the existing Setup
payment section. A narrow local-dev compatibility repair allows the existing
root-relative local branding fallback URL through the same profile validator
that already accepts production HTTPS URLs, so upload → text → Save can finish.

Verification is green: focused 9/9; full 469 passed / 117 skipped; canonical
TypeScript; scoped ESLint; production build; and headed desktop plus 390×844
browser QA with zero application console errors or horizontal overflow. The
desktop live sequence proved `3 details left` → logo upload → `2 details left`
→ cover upload → `1 detail left` → description Save → `Done — continue guide`
→ ready screen. Current QA evidence is under
`output/playwright/kds-readiness-stage1/`.

Stage 2 and Question 11 remain unstarted. Nothing was deployed, migrated,
pushed, imported from Ops, or changed in the Marketing Lead Form.
