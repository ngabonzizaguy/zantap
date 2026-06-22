# Audit: `lib/types.ts` vs `prisma/schema.prisma`

**Date:** 2026-06-22  
**Candidate:** #5 — Make Prisma the type source; Zod at the seam  
**Verdict:** Drift is **real but latent** — intentional domain omissions, not production bugs. Defer implementation until a trigger fires (see PRD).

---

## Entity field comparison

### Vendor

| Field | Prisma | `lib/types` Vendor | Notes |
|-------|--------|-------------------|-------|
| id, name, slug, phoneNumber, momoCode, isActive | ✓ | ✓ | aligned |
| tagline, location, deliveryTime, rating | optional | optional | aligned |
| createdAt | ✓ | ✓ | aligned |
| **kitchenOpen** | ✓ | ✗ | **Intentional omission** — kitchen state exposed via `Store.isKitchenOpen` / `setKitchenOpen`, not on the Vendor DTO returned to UI |
| **updatedAt** | ✓ | ✗ | **Intentional omission** — not used by any caller |

### MenuItem

| Field | Prisma | `lib/types` MenuItem | Notes |
|-------|--------|---------------------|-------|
| core fields | ✓ | ✓ | aligned |
| createdAt, updatedAt | ✓ | ✗ | omitted from domain DTO; no caller reads them |

### Order

| Field | Prisma | `lib/types` Order | Notes |
|-------|--------|------------------|-------|
| core fields + orderItems | ✓ | ✓ | aligned |
| **payment** relation | optional 1:1 | ✗ | **Intentional omission** — Payment accessed via Store payment verbs, not nested on Order |
| updatedAt | ✓ | ✗ | omitted; no caller reads it |

### OrderItem

| Field | Prisma | `lib/types` OrderItem | Notes |
|-------|--------|----------------------|-------|
| all scalar fields | ✓ | ✓ | aligned |
| menuItem (include) | relation | optional `menuItem?` | aligned — populated by adapters on read |

### Driver

| Field | Prisma | `lib/types` Driver | Notes |
|-------|--------|-------------------|-------|
| id, vendorId, name, phone, initials, hue | ✓ | ✓ | aligned |
| createdAt | ✓ | ✗ | omitted from domain DTO |
| hue default `#F5945F` | schema default | required string | compatible — seed + adapters always set hue |

### Payment

| Field | Prisma | `lib/types` Payment | Notes |
|-------|--------|--------------------|-------|
| all scalars | ✓ | ✓ | aligned |
| updatedAt | ✓ | ✗ | omitted; no caller reads it |

---

## Enum comparison

| Enum | Prisma | `lib/types` | Match |
|------|--------|-------------|-------|
| OrderStatus | `PENDING \| PAID \| DISPATCHED \| COMPLETED` | same string union | ✓ |
| PaymentProvider | `MTN_MOMO \| AIRTEL_MONEY` | inline on Payment | ✓ |
| PaymentStatus | `PENDING \| SUCCESS \| FAILED` | inline on Payment | ✓ |

Enums are **duplicated** (schema enum + hand-written union) but **currently in sync**.

---

## Types in `lib/types.ts` with no Prisma model

These are **not drift** — they are seam/UI/API DTOs that should stay outside Prisma:

| Type | Role |
|------|------|
| `CreateOrderInput` | Store write DTO |
| `CreatePaymentInput` | Store write DTO |
| `CreatePaymentResult`, `ConfirmPaymentResult` | Store operation results |
| `StkPushRequest`, `StkPushResponse`, `ConfirmPinRequest` | MoMo simulate API |
| `CheckoutStage` | Client checkout stage machine |
| `KIGALI_SECTORS`, `KigaliSector` | Domain constant (not persisted) |

---

## Mapper smell (`lib/store/prisma.ts`)

Three `as` casts bridge Prisma enums to hand-written unions:

```ts
provider: payment.provider as Payment["provider"],
status: payment.status as Payment["status"],
status: order.status as OrderStatus,
```

Safe today because values match, but **will not fail at compile time** if schema enums diverge.

---

## Import surface

~25 files import from `@/lib/types`. Heavy consumers:

- `lib/store/types.ts`, `prisma.ts`, `in-memory.ts`, `seed-data.ts`
- `lib/actions/customer.ts`, `vendor.ts`
- `lib/checkout/*`
- `components/customer/*`, `components/vendor/*`
- `lib/kds/types.ts`, `lib/momo/simulate.ts`, `lib/whatsapp.ts`

No file imports Prisma types outside `lib/store/prisma.ts`, `lib/prisma.ts`, tests, and seed.

---

## Zod status

- **Not installed** (`package.json` has no `zod` dependency).
- Validation today: `lib/checkout/validation.ts` (hand-rolled checks for phone, sector, landmark, cart).
- Store seam (`createOrder`, `createPayment`) accepts typed inputs with **no runtime validation**.

---

## Is drift a real maintenance cost **today**?

| Signal | Assessment |
|--------|------------|
| Production bugs from type mismatch | **None observed** |
| Enum/schema out of sync | **No** — values aligned |
| Manual mapper maintenance | **Yes** — every schema field change needs `lib/types` + both adapters + seed |
| Runtime validation at Store seam | **Missing** — would benefit from Zod on write DTOs |
| `as` casts hiding future enum drift | **Latent risk** |

**Conclusion:** Dual maintenance is a **latent** cost, not an **active** one. The candidate's own "speculative" rating holds — proceed when a trigger fires (see PRD).

---

## Recommended first slice (when triggered)

Issue 01 only — do not boil the ocean:

1. Add `zod` dependency.
2. Re-export `OrderStatus`, `PaymentStatus`, `PaymentProvider` from `@prisma/client` (or a thin `lib/domain/enums.ts` re-export) and delete duplicate unions from `lib/types.ts`.
3. Add `createOrderInputSchema` Zod DTO; validate in `lib/actions/customer.ts` (or at top of `Store.createOrder`) before the adapter runs.
4. Remove the three `as` casts in `prisma.ts` mapper once enums share one source.
5. Keep entity DTOs (`Vendor`, `Order`, etc.) as hand-shaped read models until issue 02 — the intentional omissions (`kitchenOpen`, `updatedAt`, nested `payment`) are correct domain boundaries.
