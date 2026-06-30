# Provision actions and guard — PROVISION_SECRET + provisionVendor

Status: done 2026-06-30

## Parent

PRD: `.scratch/vendor-onboarding/PRD.md`  
Flow: `.scratch/vendor-onboarding/FLOW.md`  
ADR: `docs/adr/0020-vendor-provisioning-store-create-vendor.md`

## Scope (one session)

Server-only provisioning path: secret guard + Server Actions wrapping Store vendor
create (+ optional first menu item). **No wizard UI.**

## What to build

### Provision secret (`lib/vendor/provision-secret.ts`)

Mirror `lib/vendor/write-secret.ts`:

- `assertProvisionSecret(secret: string)` — compares to `process.env.PROVISION_SECRET`
- `ProvisionSecretError` typed error
- When env unset: assert throws (prod fail-closed)

Document in `.env.example`:

```
# One-time vendor signup code (shared until auth #12)
PROVISION_SECRET=
```

### Server Actions (`lib/actions/vendor-provision.ts`)

`"use server"` — **export only async functions** (no type re-exports).

```ts
export async function checkSlugAvailable(slug: string): Promise<boolean>;

export async function provisionVendor(
  provisionSecret: string,
  input: CreateVendorInput,
  starterItem?: { name: string; priceRwf: number }
): Promise<{ vendor: Vendor; menuItem?: MenuItem }>;
```

**`provisionVendor` flow:**

1. `assertProvisionSecret(provisionSecret)`
2. Normalize slug via shared helper
3. If `!await store.isSlugAvailable(slug)` → throw user-safe error
4. `createVendor(input)`
5. If `starterItem`: `createMenuItem(slug, { name, priceRwf, category: "General" })`
   — **not** write-secret guarded (provisioning is already secret-guarded)
6. Return vendor (+ menuItem)

**Optional:** Prisma-only transaction wrapping steps 4–5 inside adapter helper;
acceptable to ship sequential calls first if contract tests cover happy path.

### Input validation

Light validation in action (or shared `lib/vendor/provision-validation.ts`):

- `name`, `phoneNumber`, `momoCode` non-empty
- `priceRwf` integer > 0 when `starterItem` present
- Phone via existing `normalizePhone` if available server-side

## Files touched

| Area | Paths |
|------|-------|
| Guard | `lib/vendor/provision-secret.ts` (new) |
| Actions | `lib/actions/vendor-provision.ts` (new) |
| Env | `.env.example` |
| Tests | `lib/actions/__tests__/vendor-provision.test.ts` (mock Store or in-memory) |

**Avoid:** UI routes, `SetupDrawer`, changing write-secret behavior.

## Acceptance criteria

- [x] Wrong/missing provision secret throws `ProvisionSecretError`
- [x] Duplicate slug rejected before create
- [x] Happy path: vendor + starter item → `getAvailableMenu` length ≥ 1
- [x] `npm test` green; `npm run build` passes

## Test plan

1. Unit/integration tests with in-memory Store + `PROVISION_SECRET` in vitest env
2. `npm run build`

## Blocked by

- Issue 01 (`store-vendor-provision`)

## Unblocks

- Issue 03 (`onboard-wizard-ui`)

## Comments
