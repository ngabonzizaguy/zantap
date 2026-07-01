# Issue 3 — Wizard UI (dark, 7 surfaces)

Status: not started

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
