# ADR-0021: KDS Setup storefront profile (Layer B)

**Status:** Accepted  
**Date:** 2026-06-30  
**Parent:** Candidate #15 vendor onboarding, Issue 04

## Context

Layer A `/onboard` wizard collects identity + first dish but defers storefront
polish fields (tagline, location, delivery time, rating). Vendors need a browser
path to edit these without operator intervention. KDS Setup already hosts the
write-secret gate and operational checklist (ADR-0012).

The storefront does **not** enforce kitchen-closed ordering (PRD §1.9). Checklist
and coachmark copy incorrectly claimed customers cannot order while closed.

## Decision

1. **`updateVendorProfile` server action** (`lib/actions/vendor-profile.ts`) —
   guarded by `assertWriteSecret`, delegates to `Store.updateVendor` (ADR-0020).
   No new Store verbs.

2. **Setup drawer "Storefront profile" section** — tagline, location, delivery
   time, optional rating; loads from vendor props on open; save requires write
   secret on device.

3. **Copy-only checklist/coachmark fixes** — soften `kitchenOpen` hint and
   kitchen-toggle coachmark; note wizard may have pre-filled `hasMenuItem`.

Slug and `momoCode` remain immutable in v1 (operator/support only).

## Consequences

- Profile deferral from provisioning is complete; storefront reflects saves on
  next RSC load of `/{slug}`.
- Kitchen-open messaging is honest until a storefront gate ships.
- Future auth (#12) replaces write-secret guard on the same action surface.

## Alternatives considered

- **Extend KDS SSE snapshot with vendor profile** — rejected; profile changes
  are rare and storefront is the read surface; avoids bloating stream payload.
- **Edit profile on `/onboard` step 3** — out of scope; Layer B owns deferred fields.
