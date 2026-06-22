# PRD: Prisma as type source; Zod at the seam

Status: audited — deferred pending trigger  
Feature slug: prisma-type-source  
Source: architecture candidate #5  
Audit: `.scratch/prisma-type-source/AUDIT.md`  
ADR: `docs/adr/0003-prisma-type-source-audit.md`

## Problem

Domain types in `lib/types.ts` duplicate `prisma/schema.prisma`. Enums are
maintained twice; the Prisma adapter uses `as` casts; write DTOs crossing the
Store seam have compile-time types but no runtime validation.

## Audit verdict (2026-06-22)

Drift is **real but latent**. Omissions (`kitchenOpen` on Vendor, `updatedAt`,
nested `payment` on Order) are **intentional domain shaping**, not bugs. Enums
are in sync today. No production incidents. Maintenance cost will rise when the
schema changes frequently or a new contributor adds a Prisma field without
updating `lib/types.ts`.

## Triggers to start implementation

Proceed with issue 01 when **any** of:

1. A schema migration lands without a matching `lib/types.ts` update (actual drift bug or PR review catch).
2. A second payment provider or new `OrderStatus` value is added (enum duplication risk).
3. External/untrusted input starts hitting Store write paths (need runtime validation).

Until then, keep the backlog queued.

## Solution (phased)

### Issue 01 — Enums from Prisma + Zod on `CreateOrderInput` (smallest slice)

- Install `zod`.
- Single enum source: re-export Prisma enums; remove duplicate unions from `lib/types.ts`.
- `createOrderInputSchema` validated at the customer action boundary.
- Drop `as` enum casts in `lib/store/prisma.ts`.
- Tests: schema rejects bad phone/empty items; existing contract suite still green.

### Issue 02 — Zod on `CreatePaymentInput` + payment result DTOs

- Validate payment write path; align with ADR-0001 invariants in schema (positive amount, non-empty ref).

### Issue 03 — Entity read models (optional, larger)

- Evaluate `Prisma.VendorGetPayload<…>` vs keeping slim hand-written read DTOs.
- Only migrate entities where the DTO === Prisma row shape; keep intentional omissions.

## Out of scope

- Replacing `lib/checkout/validation.ts` with Zod in issue 01 (can converge later).
- Client-side Zod (browser must not import Prisma; server-only schemas).
- `zod-prisma` / auto-generated Zod from schema (revisit if issue count grows).
- Changing intentional Vendor/Order DTO omissions.

## Acceptance (full candidate — not issue 01)

- [ ] Prisma enums are the single source; no duplicate string unions for DB enums.
- [ ] Store write DTOs validated with Zod before adapters run.
- [ ] No `as` enum casts in `lib/store/prisma.ts`.
- [ ] `npm test` green.
- [ ] ADR updated when implementation ships.
