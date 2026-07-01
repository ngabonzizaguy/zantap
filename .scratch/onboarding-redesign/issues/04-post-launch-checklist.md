# Issue 4 — Post-launch checklist

Status: not started

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
