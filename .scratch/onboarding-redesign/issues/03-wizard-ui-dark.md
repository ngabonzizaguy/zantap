# Issue 3 — Wizard UI (dark, 7 surfaces)

Status: done (2026-07-01)

## Parent

PRD: `.scratch/onboarding-redesign/PRD.md` · ADR: `docs/adr/0022`, `docs/adr/0017` (`.kds-dark`)
Design: `design-assets/UI-screens/*.png`

## Scope (one session)

Replace `components/onboard/*` + `app/onboard/*` with the redesigned dark, mobile-first,
self-serve flow. Consumes Issue 2's actions.

## Surfaces (from mockups)

0. Splash — value prop, role wheel, Get Started.
1. Business essentials — name, storefront URL (live slug availability via `checkSlugAvailable`,
   debounced), phone (country picker), business category dropdown.
2. Payments — radio: MoMo Merchant Code | Receive to Phone Number + inline validation → `payoutMethod`.
3. Quick Menu — first dish (name, price RWF, category, optional photo, live preview).
4. Review & Confirm — editable summary cards → **Go Live** (calls `provisionVendor`).
5. You're Live — confetti, storefront URL, QR code, Share/Copy, Open Kitchen Dashboard.
   Owner token auto-cached. If a first-dish photo was chosen, upload it here (post-provision,
   keyed to the new menu item, using the owner token).
6. Optional checklist — entry point into Issue 4.

Theme: `.kds-dark`, momo-orange `#F5A623`. No `PROVISION_SECRET` gate screen.
Add a "Recover access" entry (slug + signup phone → `recoverOwnerToken`).

## Files touched

`app/onboard/*`, `components/onboard/*`, QR helper, `useOwnerToken` usage.

## Blocked by

Issue 2.

## Unblocks

Issue 4.

## Comments

Shipped 2026-07-01 (ADR-0025). `npm run build` clean; `npm test` **174 passed /
64 skipped** (the 2 skipped files are the opt-in remote `#prisma` suite).

Delivered:

- [x] `/onboard` rebuilt as the dark `.kds-dark`, mobile-first step machine
  (`OnboardWizard` + `WizardData`/`WizardStep` + shared `WizardProgress`):
  splash (role wheel) → business essentials → payments → quick menu → review →
  You're Live. New step components under `components/onboard/steps/*`.
- [x] Business essentials: live slug availability (`checkSlugAvailable`,
  debounced, `zantap.ai/` prefix + green check), country dial-code picker +
  phone, Business Category dropdown (`lib/vendor/onboard-options.ts`).
- [x] Payments: radio `MoMo Merchant Code | Receive to Phone Number` → drives
  `payoutMethod`; PHONE stores the payout phone in `momoCode` (ADR-0025 dec. 4).
- [x] Quick Menu: first dish + category + optional photo + live preview.
- [x] Review & Confirm: editable summary cards (Edit jumps back) → Go Live.
- [x] You're Live: CSS confetti, glowing icon, storefront URL + copy, QR
  (`qrcode.react`), Share/Copy, Open Kitchen Dashboard. Owner token auto-cached;
  chosen category + optional photo persisted **post-provision** via existing
  `updateMenuItem`/`uploadMenuImage` (decision 7, no server change).
- [x] Page gate removed: `app/onboard/page.tsx` renders the wizard
  unconditionally; signup closable only via `PROVISION_KILL_SWITCH`. Deleted
  `GateStep`, `OperatorContact`, `is-provision-enabled.ts`, `useProvisionSecret.ts`,
  and the old `FirstDishStep`/`SuccessStep`.
- [x] Recovery UI: `RecoverAccessDialog` (slug + signup phone → `recoverOwnerToken`,
  auto-caches token) from the splash + deep link `/onboard?recover=1`. The interim
  manual owner-token paste field in `SetupDrawer` is removed (now a lock chip +
  "Recover access" link). `useOwnerToken` never prompts.
- [x] Confetti/QR added `qrcode.react`; confetti seeded on mount (no hydration
  mismatch); motion off under `prefers-reduced-motion`.

Not touched: the post-launch optional checklist (Issue 4).

**Not yet deployed** — branch `feat/onboarding-redesign`. Prod cutover on
deploy: `PROVISION_SECRET` can be removed from Vercel (no code reads it), leave
`PROVISION_KILL_SWITCH` unset to keep signup open.
