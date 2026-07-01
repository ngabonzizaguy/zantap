# Issue 1 — Schema + Store + owner token

Status: done (2026-07-01)

## Parent

PRD: `.scratch/onboarding-redesign/PRD.md`
Decisions: `.scratch/onboarding-redesign/grill-decisions.md`
ADR: `docs/adr/0022-self-serve-onboarding-and-owner-token.md`

## Scope (one session)

Extend the data layer only: new Vendor attributes, a recovery-event log, and the
owner-token primitive. **No Server Actions, no wizard UI, no route changes, no guard
swap.** (Those are Issues 2–4.)

## What to build

### Domain types (`lib/types.ts`)

- `PayoutMethod` = `"MERCHANT_CODE" | "PHONE"`.
- `Vendor` — add `businessCategory?`, `payoutMethod` (required, defaults to
  `MERCHANT_CODE`), `logoUrl?`, `coverImageUrl?`, `description?`. **Do NOT** add
  `ownerTokenHash` to the domain `Vendor` (it is a server-only secret; never sent to
  the browser).
- `CreateVendorInput` — add `businessCategory?`, `payoutMethod?`, `logoUrl?`,
  `coverImageUrl?`, `description?`, `ownerTokenHash?`.
- `UpdateVendorInput` — add `businessCategory?`, `payoutMethod?`, `logoUrl?`,
  `coverImageUrl?`, `description?`.
- `VendorRecoveryEvent` — `id`, `vendorId`, `at: Date`, `context?`.
- `RecordRecoveryEventInput` — `vendorId`, `context?`.

### Owner-token helper (`lib/vendor/owner-token.ts`, new)

- `mintOwnerToken(): { token: string; hash: string }` — random token (crypto), sha256 hash.
- `hashOwnerToken(token): string`.
- `verifyOwnerToken(token, hash): boolean` — timing-safe compare.
- Unit tests `lib/vendor/__tests__/owner-token.test.ts`.

### Prisma schema (`prisma/schema.prisma`) + migration

- `Vendor`: `businessCategory String?`, `payoutMethod PayoutMethod @default(MERCHANT_CODE)`,
  `logoUrl String?`, `coverImageUrl String?`, `description String?`, `ownerTokenHash String?`,
  `recoveryEvents VendorRecoveryEvent[]`.
- `enum PayoutMethod { MERCHANT_CODE PHONE }`.
- `model VendorRecoveryEvent { id, vendorId, vendor (relation, cascade), at, context String?, @@index([vendorId]) }`.
- Migration `*_onboarding_redesign_vendor_fields`. **No backfill** — one personal test
  vendor only; the seed re-seeds it with a fresh owner token.

### Store interface (`lib/store/types.ts`)

```ts
getVendorOwnerTokenHash(vendorSlug: string): Promise<string | null>;
setVendorOwnerToken(vendorSlug: string, ownerTokenHash: string): Promise<Vendor | null>;
recordRecoveryEvent(input: RecordRecoveryEventInput): Promise<VendorRecoveryEvent>;
listRecoveryEvents(vendorId: string): Promise<VendorRecoveryEvent[]>;
```

Plus the new fields flow through `createVendor` / `updateVendor` / `mapVendor`.

### Adapters (`in-memory.ts`, `prisma.ts`) + seed

- Both persist/read the new fields identically; `payoutMethod` defaults to `MERCHANT_CODE`.
- `ownerTokenHash` is stored but never returned on the domain `Vendor`.
- Recovery events stored + listed newest-first.
- Seed (`lib/store/seed-data.ts` + `prisma/seed.ts` + in-memory `load()`): re-seed the
  demo vendor with `payoutMethod = MERCHANT_CODE` and a fresh owner-token hash
  (`DEMO_OWNER_TOKEN` constant, deterministic for local testing).

### Contract tests (`lib/store/__tests__/contract.ts`)

- [x] `createVendor` persists `businessCategory` + `payoutMethod` + `description`; round-trips.
- [x] `payoutMethod` defaults to `MERCHANT_CODE` when omitted.
- [x] `updateVendor` patches `logoUrl` / `coverImageUrl` / `description` / `payoutMethod`.
- [x] owner token: `createVendor` with `ownerTokenHash` → `getVendorOwnerTokenHash` returns it;
  `setVendorOwnerToken` re-issues; hash never leaks onto the returned `Vendor`.
- [x] recovery events: `recordRecoveryEvent` then `listRecoveryEvents` returns it (newest-first).

## Files touched

| Area | Paths |
|------|-------|
| Types | `lib/types.ts` |
| Helper | `lib/vendor/owner-token.ts` (new) |
| Schema | `prisma/schema.prisma`, `prisma/migrations/*` |
| Store | `lib/store/types.ts`, `in-memory.ts`, `prisma.ts` |
| Seed | `lib/store/seed-data.ts`, `prisma/seed.ts` |
| Tests | `lib/store/__tests__/contract.ts`, `lib/vendor/__tests__/owner-token.test.ts` |

**Avoid:** Server Actions, routes, UI, guard swap, rate limiting, `recoverOwnerToken`.

## Acceptance criteria

- [x] Store interface documents the 4 new verbs; both adapters implement identical semantics.
- [x] `npm test` green — 170 passed (in-memory contract incl. new owner-token/recovery/field
  cases + `owner-token` units). Remote Prisma `#prisma` contract suite is opt-in and
  **stalled on this machine's Supabase Free pooler** (documented in AGENTS.md) after the
  schema push succeeded — not a code fault; the same contract runs green in-memory.
- [x] `npm run build` passes (TypeScript clean).
- [x] Migration `20260701150531_onboarding_redesign_vendor_fields` applied to the real DB
  (additive: nullable columns + `PayoutMethod` default + `VendorRecoveryEvent`); `db:seed`
  re-seeds `inka-steakhouse` with the fresh deterministic owner token.

## Blocked by

Nothing.

## Unblocks

- Issue 2 (server actions + owner-token guard swap + recovery).

## Comments

Shipped 2026-07-01. Decisions made this session:
- **`payoutMethod` = real Prisma enum `PayoutMethod`** (not a bare String), matching the
  codebase's existing enum pattern (OrderStatus/KitchenStage) and the exhaustive-switch rule.
- **`ownerTokenHash` is NOT on the domain `Vendor`** (server-only). Read via
  `Store.getVendorOwnerTokenHash`; compare with `lib/vendor/owner-token.verifyOwnerToken`.
- **Demo owner token is deterministic** (`DEMO_OWNER_TOKEN` in `seed-data.ts`) so local dev
  can exercise the owner-token guard on `inka-steakhouse` without provisioning. Only the hash
  is stored. This is the "fresh owner token" for the re-seeded test vendor (decision 10).
- Owner-token crypto: `randomBytes(24)` base64url token, sha256 hex hash, timing-safe verify.
