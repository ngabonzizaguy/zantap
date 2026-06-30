# Store vendor provision — createVendor, updateVendor, isSlugAvailable

Status: done (2026-06-30)

## Parent

PRD: `.scratch/vendor-onboarding/PRD.md`  
Flow: `.scratch/vendor-onboarding/FLOW.md`  
ADR: `docs/adr/0020-vendor-provisioning-store-create-vendor.md`

## Scope (one session)

Extend the Store seam with vendor write verbs. **No UI, no Server Actions, no routes.**

## What to build

### Domain types (`lib/types.ts`)

- `CreateVendorInput` — `name`, `slug`, `phoneNumber`, `momoCode`; optional
  `tagline`, `location`, `deliveryTime`.
- `UpdateVendorInput` — optional `name`, `phoneNumber`, `momoCode`, `tagline`,
  `location`, `deliveryTime`, `rating`.

### Store interface (`lib/store/types.ts`)

```ts
isSlugAvailable(slug: string): Promise<boolean>;
createVendor(input: CreateVendorInput): Promise<Vendor>;
updateVendor(
  vendorSlug: string,
  input: UpdateVendorInput
): Promise<Vendor | null>;
```

### Slug normalization

Shared helper in `lib/vendor/slug.ts` (or `lib/store/slug.ts`):

- Lowercase, trim, spaces → hyphens, strip invalid chars.
- `isSlugAvailable` checks normalized form against existing vendors.

### Adapter implementations

**`lib/store/in-memory.ts`**

- Track vendors in seed map; `createVendor` assigns `cuid`-like id + `createdAt`.
- Defaults: `isActive: true`, `kitchenOpen: true` (kitchenOpen lives on Vendor in Prisma
  but may be omitted from `Vendor` domain type — follow existing adapter mapping for
  `isKitchenOpen` reads).

**`lib/store/prisma.ts`**

- `create` with Prisma `Vendor` model fields.
- `updateVendor` by slug; return null if not found.
- `isSlugAvailable`: `findUnique` on slug === null.

### Contract tests (`lib/store/__tests__/contract.ts`)

Add cases:

- [x] `isSlugAvailable` true for unused slug, false for `seedVendor.slug`
- [x] `createVendor` persists required fields; `getVendorBySlug` round-trip
- [x] `createVendor` rejects duplicate slug (throw typed error or return — match
  existing Store error patterns)
- [x] `updateVendor` patches tagline/location; slug unchanged
- [x] `updateVendor` returns null for unknown slug

Run on **both** adapters (in-memory always; Prisma when `TEST_DATABASE_URL` set).

## Files touched

| Area | Paths |
|------|-------|
| Types | `lib/types.ts` |
| Store | `lib/store/types.ts`, `in-memory.ts`, `prisma.ts` |
| Helper | `lib/vendor/slug.ts` (new) |
| Tests | `lib/store/__tests__/contract.ts`, `lib/vendor/__tests__/slug.test.ts` |

**Avoid:** Server Actions, routes, UI, `PROVISION_SECRET`.

## Acceptance criteria

- [x] Store interface documents three new verbs
- [x] Both adapters implement identical semantics
- [x] Contract tests green (`npm test` — 200/200)
- [x] `npm run build` passes
- [x] Seed/demo vendor unchanged (`inka-steakhouse` still works)

## Test plan

1. `npm test` — contract suite includes new vendor cases
2. `npm run build`

## Blocked by

Nothing.

## Unblocks

- Issue 02 (`provision-actions-and-guard`)

## Comments

Shipped 2026-06-30. Duplicate slug throws `Error("Slug already taken")` on both adapters.
`normalizeVendorSlug` in `lib/vendor/slug.ts` shared by adapters and tests.
