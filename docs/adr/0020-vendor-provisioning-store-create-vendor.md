# ADR-0020: Vendor provisioning via Store.createVendor with provision-secret gate

Date: 2026-06-30
Status: Accepted

## Context

Candidate #15 requires a ~1-minute vendor go-live path. Today vendors exist only via
seed (`lib/store/seed-data.ts`) or manual DB inserts. The Store interface exposes
`getVendorBySlug` but no create/update verbs. The KDS Setup checklist (ADR-0012) covers
**post-provision** operational steps (photos, kitchen, first order) — not account creation.

Real vendor authentication is deferred (candidate #12, ADR-0009). Any public signup path
needs an interim abuse guard consistent with the write-secret pattern.

## Decision

1. **Extend the Store seam** with:
   - `isSlugAvailable(slug)` — normalized uniqueness check
   - `createVendor(input: CreateVendorInput)` — required fields: `name`, `slug`,
     `phoneNumber`, `momoCode`; defaults `isActive: true`, `kitchenOpen: true`
   - `updateVendor(vendorSlug, input: UpdateVendorInput)` — profile fields only; slug
     immutable after create in v1

2. **Provision Server Actions** in `lib/actions/vendor-provision.ts`:
   - `checkSlugAvailable(slug)` — unguarded read for wizard async validation
   - `provisionVendor(provisionSecret, input, starterItem?)` — calls
     `assertProvisionSecret` then `createVendor` and optionally `createMenuItem` for the
     first dish

3. **Interim guard:** env `PROVISION_SECRET` + `lib/vendor/provision-secret.ts` (mirror
   `write-secret.ts`). Production `/onboard` fails closed when unset. Wizard stores the
   secret in `sessionStorage` for the session only.

4. **Two-layer onboarding model:**
   - **Layer A (new):** `/onboard` wizard — identity + first menu item
   - **Layer B (existing):** KDS Setup drawer checklist + coachmarks (ADR-0012)

5. **Field placement:**
   - Wizard collects: `name`, `slug`, `phoneNumber`, `momoCode`, first item name/price
   - Deferred to KDS Setup / Menu: tagline, location, delivery time, rating, photos,
     write-secret, kitchen toggle, additional dishes

## Consequences

- Seed path remains for demo vendor; tests use in-memory `createVendor` in contract suite.
- Slug collisions surface in wizard before submit; no client-side-only validation.
- Orphan vendor (create succeeds, menu fails) is acceptable in v1; wizard shows error and
  links to KDS Menu tab. Prisma adapter may use a transaction in `provisionVendor` as an
  optimization.
- `momoCode` is collected at signup for schema compliance and future live MoMo (#11); sim
  checkout does not read it today.
- Per-vendor provision tokens arrive with auth (#12); `PROVISION_SECRET` is deployment-wide
  like `VENDOR_WRITE_SECRET`.
- ADR-0012 checklist unchanged structurally; `hasMenuItem` auto-completes after wizard.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| CLI-only / seed script | No ~1 min browser go-live for vendors |
| Direct Prisma in route handler | Violates Store single-seam rule (AGENTS.md) |
| `createVendor` unguarded in prod | Spam tenants without auth |
| Fold provisioning into write-secret | Different audiences (one-time signup vs daily staff) |
| Collect tagline/location in wizard | Defaults suffice; KDS profile editor is lower friction |
