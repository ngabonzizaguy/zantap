# KDS Setup profile + checklist copy — deferred storefront fields

Status: done

## Parent

PRD: `.scratch/vendor-onboarding/PRD.md`  
Flow: `.scratch/vendor-onboarding/FLOW.md`  
ADR: `docs/adr/0020-vendor-provisioning-store-create-vendor.md`, ADR-0012

## Scope (one session)

Layer B polish: let vendors edit deferred storefront profile fields from KDS Setup;
harmonize checklist hints for post-wizard vendors; fix kitchen-closed copy vs storefront
gap.

## What to build

### Server Action (`lib/actions/vendor-profile.ts`)

`"use server"` only async exports.

```ts
export async function updateVendorProfile(
  writeSecret: string,
  vendorSlug: string,
  input: UpdateVendorInput
): Promise<Vendor>;
```

- Guard with `assertWriteSecret` (same as menu CRUD)
- Delegates to `Store.updateVendor`

### Setup drawer — "Storefront profile" section

Extend `components/vendor/SetupDrawer.tsx`:

- Fields: tagline, location, delivery time, rating (optional number)
- Load current values from KDS snapshot or dedicated read on drawer open
- Save button → `updateVendorProfile`
- Helper copy: "Shown on your customer menu page"

**Not in this section:** slug, momoCode (immutable in v1 or link to support), name/phone
(optional stretch — only if trivial).

### Checklist copy (`lib/vendor/onboarding.ts`)

Update hints only (no new steps):

- `hasMenuItem` hint: mention wizard may have already completed this
- `kitchenOpen` hint: soften — "Toggle OPEN when you're ready to accept orders" (remove
  false claim that customers cannot order when closed until storefront gate ships)

### Coachmark copy (`components/vendor/Coachmark.tsx` or targets)

Align kitchen toggle coachmark with softened messaging (PRD §1.9 known gap).

## Files touched

| Area | Paths |
|------|-------|
| Action | `lib/actions/vendor-profile.ts` (new) |
| UI | `components/vendor/SetupDrawer.tsx` |
| Copy | `lib/vendor/onboarding.ts`, coachmark strings |
| Tests | optional action test; onboarding hint snapshot if any |

**Avoid:** `/onboard` wizard changes, `createVendor` changes.

## Acceptance criteria

- [x] Vendor can set tagline/location/delivery time from Setup; storefront reflects on refresh
- [x] Write-secret required for profile save
- [x] Checklist/coachmark copy no longer claims storefront kitchen gate
- [x] `npm test` green if tests added; `npm run build` passes

## Test plan

1. Manual: update tagline in Setup → reload `/{slug}` → hero shows new tagline
2. `npm run build`

## Blocked by

- Issue 01 (`store-vendor-provision`) — needs `updateVendor`

**Soft:** Issue 03 — wizard handoff copy references Setup profile section; can ship before
03 if section is self-explanatory.

## Unblocks

- Candidate #15 acceptance (profile deferral complete)

## Comments
