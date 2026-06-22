# Enums from Prisma + Zod validate `CreateOrderInput`

Status: ready-for-agent (blocked — wait for PRD trigger)

## Parent

PRD: `.scratch/prisma-type-source/PRD.md`  
Audit: `.scratch/prisma-type-source/AUDIT.md`

## Blocked by

PRD trigger — do **not** start until audit defer is lifted (see PRD "Triggers to start implementation").

## What to build

Smallest useful slice of candidate #5:

1. Add `zod` to dependencies.
2. Create `lib/store/schemas.ts` (server-only) with `createOrderInputSchema` matching `CreateOrderInput`.
3. Re-export `OrderStatus`, `PaymentStatus`, `PaymentProvider` from `@prisma/client` via a thin `lib/domain/enums.ts` (or similar); update `lib/types.ts` to import enums from there instead of hand-written unions.
4. Validate `CreateOrderInput` in `lib/actions/customer.ts` before `store.createOrder`.
5. Remove `as OrderStatus` / `as Payment[...]` casts in `lib/store/prisma.ts` once types align.
6. Unit tests for the schema (invalid phone, empty items, bad slug).

## Acceptance criteria

- [ ] `zod` installed; no Prisma imports in client components.
- [ ] DB enums have one source (`@prisma/client`); duplicate unions removed from `lib/types.ts`.
- [ ] `createOrder` rejects invalid input at runtime with a stable error (no adapter call).
- [ ] `npm test` green (including existing Store contract suite).
- [ ] No changes to intentional entity DTO omissions (`kitchenOpen`, `updatedAt`, nested `payment`).

## Files likely touched

- `package.json`
- `lib/domain/enums.ts` (new)
- `lib/store/schemas.ts` (new)
- `lib/types.ts`
- `lib/actions/customer.ts`
- `lib/store/prisma.ts`
- `lib/store/__tests__/` or `lib/store/schemas.test.ts` (new)

## Decisions (settled in audit)

- Entity read DTOs stay hand-shaped for issue 01; enum unification + one write DTO only.
- `lib/checkout/validation.ts` not replaced in this slice.
