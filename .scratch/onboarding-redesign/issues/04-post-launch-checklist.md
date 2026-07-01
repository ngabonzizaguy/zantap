# Issue 4 — Post-launch checklist

Status: done (2026-07-01) — ADR-0026

## Parent

PRD: `.scratch/onboarding-redesign/PRD.md` · ADR: `docs/adr/0022`

## Scope (one session)

The post-launch "0 of N" checklist, wired into the existing KDS Setup drawer, adding
only the core missing profile fields.

## What to build

- Checklist UI (progress "0 of N") surfaced after Go Live and from the KDS Setup drawer.
- Add core fields to the profile editor: **logo**, **cover image**, **description**
  (persisted via `updateVendorProfile` + Issue 1 fields). Business category shows too.
- Reuse existing MenuImage gallery for "Menu Photos"; existing customization for
  "Ingredients"; tagline already exists.
- **Deferred (follow-up epic, not here):** business hours, delivery zones, estimated
  prep time, social links.

## Files touched

KDS Setup drawer component(s), profile editor, checklist component (new),
`lib/actions/vendor-profile.ts` (accept logo/cover/description).

## Blocked by

Issues 1–3.

## Unblocks

Candidate #16 acceptance (prod smoke per PRD).

## Delivered (2026-07-01)

- [x] New pure module `lib/vendor/optional-checklist.ts` —
      `OPTIONAL_CHECKLIST_ITEMS` (9 rows, mockup order), `deriveOptionalChecklist`,
      `countOptionalCompleted`. 6 unit tests in `lib/vendor/__tests__/optional-checklist.test.ts`.
- [x] `updateVendorProfile` forwards `logoUrl` / `coverImageUrl` / `description`
      (trim → undefined), still a single async `"use server"` export.
- [x] `SetupDrawer` gains: (a) a "Keep improving your storefront" section with the
      9-row optional checklist ("X of 4 completed" — counts actionable only; the 5
      deferred rows show a "Soon" badge), and (b) Logo URL / Cover image URL inputs
      + a Business Description textarea in the profile editor. New required `menu`
      prop; `StorefrontProfile` gains the three fields.
- [x] `KdsDashboard` seeds the profile with `vendor.logoUrl/coverImageUrl/description`
      and passes `menu` to `SetupDrawer`; `onProfileSaved` round-trips the new fields
      so the checklist ticks after save.
- [x] Actionable = Logo, Cover, Menu Photos, Business Description. Deferred/`comingSoon`
      (no schema, no editor): Business Hours, Ingredients, Delivery Zones, Estimated
      Prep Time, Social Links. Owner-token guarded via existing `updateVendorProfile`
      / `useOwnerToken` (never prompts).

Not touched: no new schema/migration, no Blob upload action, no wizard/server changes.
`npm run build` clean; `npm test` **180 passed / 64 skipped** (+6 new; the 2 skipped
files are the opt-in remote `#prisma` suite). Branch `feat/onboarding-redesign`,
**not yet deployed** — candidate #16 is now feature-complete and ready for the
build → deploy → prod smoke pass.
