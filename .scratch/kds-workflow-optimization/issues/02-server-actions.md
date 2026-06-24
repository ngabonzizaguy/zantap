# Kitchen stage server actions

Status: done

## Parent

PRD: `.scratch/kds-workflow-optimization/PRD.md`  
Blocked by: Issue 01 (schema + Store) — **unblocked**

## Scope (one session)

Wire `updateKitchenStage` and `bulkUpdateKitchenStage` through guarded Server Actions in
`lib/actions/vendor.ts`. Optimistic-friendly return shapes. **No KDS UI this session.**

## What to build

- `advanceKitchenStage(orderId, stage)` — single order
- `bulkAdvanceKitchenStage(orderIds, stage)` — bulk bar target stages
- Reuse existing write-secret pattern where dispatch already uses `advanceOrderStatus`
- Unit tests if needed; `npm run build` after `"use server"` edits

## Acceptance criteria

- [x] Actions call Store only; no type re-exports from `"use server"` files
- [x] Backward transitions surface a typed error to the client
- [x] `npm run build` green

## Unblocks

- Issue 03 (KDS UI)

## Comments

Shipped 2026-06-24: `advanceKitchenStage` / `bulkAdvanceKitchenStage` in
`lib/actions/vendor.ts`; `KitchenStageTransitionError` + `assertCanAdvanceKitchenStage`
in `lib/kds/kitchen-stage.ts`; 6 unit tests; ADR-0014.
