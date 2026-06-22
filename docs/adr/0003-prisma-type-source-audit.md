# ADR-0003: Prisma type source — audit verdict (defer)

**Status:** Accepted (audit complete; implementation deferred)  
**Date:** 2026-06-22  
**Context:** Candidate #5 — `.scratch/prisma-type-source/`

## Problem

`lib/types.ts` duplicates `prisma/schema.prisma`. Candidate #5 proposes Prisma as
the type source with Zod DTOs at the Store seam.

## Audit findings

See `.scratch/prisma-type-source/AUDIT.md` for the full field-by-field comparison.

Summary:

- **Enums** (`OrderStatus`, `PaymentStatus`, `PaymentProvider`) are duplicated
  but in sync. The Prisma adapter uses three `as` casts to bridge them.
- **Entity DTOs** intentionally omit `kitchenOpen` (Vendor), `updatedAt` (several
  models), and `payment` (Order) — these are domain boundaries, not accidental drift.
- **Seam/UI types** (`CreateOrderInput`, MoMo request types, `CheckoutStage`,
  `KIGALI_SECTORS`) have no Prisma model and should remain separate DTOs.
- **Zod is not installed**; Store write paths rely on TypeScript only.

No production bugs from type mismatch were found.

## Decision

**Defer implementation** until a PRD trigger fires:

1. Schema change without matching `lib/types.ts` update.
2. New enum value or payment provider.
3. Untrusted input on Store write paths requiring runtime validation.

When triggered, ship incrementally:

1. Issue 01: Prisma enums + Zod on `CreateOrderInput` only.
2. Issue 02: Zod on payment write DTOs.
3. Issue 03 (optional): Evaluate Prisma payload types for read models where DTO === row.

Do **not** replace entity read DTOs wholesale — intentional omissions are correct.

## Consequences

- Dual maintenance of enums continues until issue 01 ships.
- `as` casts in `lib/store/prisma.ts` remain acceptable short-term.
- PRD + issue 01 are queued under `.scratch/prisma-type-source/`.
