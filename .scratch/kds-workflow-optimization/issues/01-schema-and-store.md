# Kitchen stage schema + Store seam

Status: done

## Parent

PRD: `.scratch/kds-workflow-optimization/PRD.md`  
Grill: `.scratch/kds-workflow-optimization/grill-decisions.md`  
ADR: `docs/adr/0013-kds-kitchen-stage-orthogonal-to-order-status.md`

## Scope (one session)

Add `KitchenStage` enum, `kitchenStage` + `paidAt` on `Order`, migration with backfill,
extend Store with `updateKitchenStage` / `bulkUpdateKitchenStage`, set `paidAt` + `NEW`
on PAID transition. **No server actions or KDS UI this session.**

## What to build

### Prisma

- `KitchenStage` enum: `NEW`, `ACCEPTED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `COMPLETED`
- `Order.kitchenStage` nullable (null while `PENDING`)
- `Order.paidAt` nullable (set once at `PAID`)
- Migration backfill: `PAID` → `NEW` + `paidAt`; `DISPATCHED` → `OUT_FOR_DELIVERY`; `COMPLETED` → `COMPLETED`

### Domain (`lib/types.ts`, `lib/kds/kitchen-stage.ts`)

- `KitchenStage` type + ordinal / forward-transition helpers
- `kitchenStage?`, `paidAt?` on `Order`

### Store (`lib/store/types.ts`, adapters, contract tests)

- `updateKitchenStage(orderId, stage)` — forward-only; `OUT_FOR_DELIVERY` → `DISPATCHED`; `COMPLETED` → `COMPLETED`
- `bulkUpdateKitchenStage(orderIds, stage)` — same rules per id
- `updateOrderStatus(…, PAID)` + `confirmPayment` path set `kitchenStage: NEW`, `paidAt` once
- `updateOrderStatus(…, DISPATCHED|COMPLETED)` syncs `kitchenStage`

## Acceptance criteria

- [x] Migration applied; backfill rules match grill mapping table
- [x] Contract tests cover stage transitions, backward rejection, bulk, paidAt on confirm
- [x] Seed orders include `kitchenStage` + `paidAt` for PAID samples
- [x] `npm test` green (in-memory + Prisma when `TEST_DATABASE_URL` set) — in-memory 47/47; Prisma suite slow on remote DB (re-run `npm test` locally)
- [ ] `npm run build` passes — blocked by pre-existing missing `@vercel/analytics` / `@vercel/speed-insights` in `app/layout.tsx` (unrelated to this slice)

## Unblocks

- Issue 02 (server actions)
- Issue 03 (KDS UI)

## Comments

Shipped 2026-06-24: migration `20260624120000_order_kitchen_stage`, helpers in `lib/kds/kitchen-stage.ts`, Store methods on both adapters, 8 new contract tests under `kitchen stage` + PAID sync cases.
