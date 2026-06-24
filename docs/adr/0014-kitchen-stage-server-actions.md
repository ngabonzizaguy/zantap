# Kitchen stage server actions — single throw, bulk skip

Single-order kitchen stage updates go through `advanceKitchenStage` in
`lib/actions/vendor.ts`, which validates forward-only transitions before calling
the Store and throws `KitchenStageTransitionError` (defined in
`lib/kds/kitchen-stage.ts`) when a backward move is requested. Bulk updates use
`bulkAdvanceKitchenStage`, which delegates to `bulkUpdateKitchenStage` and
silently skips orders that cannot reach the target stage (missing, unpaid, or
backward relative to current stage).

**Rationale:** Optimistic UI for a single card needs a typed, catchable error to
roll back local state. Bulk bar actions should advance every eligible ticket in
one tap without failing the whole batch because one selected order is already
past the target stage.

**Not guarded** by `VENDOR_WRITE_SECRET` — same as `advanceOrderStatus` and
other KDS operational mutations (ADR-0009).

**Types:** `"use server"` modules export only async actions; clients import
`KitchenStageTransitionError` from `@/lib/kds/kitchen-stage`, not from
`lib/actions/vendor.ts`.
