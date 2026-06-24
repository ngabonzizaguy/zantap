# KDS kitchen stage orthogonal to order status

The KDS workflow enhancement adds six kitchen progress states (`NEW` → `ACCEPTED` →
`PREPARING` → `READY` → `OUT FOR DELIVERY` → `COMPLETED`) without replacing the
existing `OrderStatus` payment/dispatch lifecycle (`PENDING` → `PAID` → `DISPATCHED` →
`COMPLETED`). A persisted `kitchenStage` column on `Order` defaults to `NEW` when
payment succeeds; the KDS sorts, badges, bulk-ops, and aging UI read `kitchenStage`
while payment visibility continues to derive from `order.status` and the Payment
record. `fetchKdsSnapshot` keeps its PAID-gated visibility filter unchanged.

**Aging:** `paidAt` on `Order` is set once at the `PAID` transition and anchors
human-readable age labels and urgency tiers (normal &lt;10m, warning 10–20m,
critical 20m+). Aging applies only while `kitchenStage` is before `OUT_FOR_DELIVERY`.

**Transitions:** Staff may jump forward to any later stage in one action (single or
bulk target-stage updates). Backward moves are rejected server-side. Entering
`OUT FOR DELIVERY` still sets `OrderStatus` to `DISPATCHED` (driver slip / History /
export semantics preserved). `kitchenStage` `COMPLETED` aligns with `OrderStatus`
`COMPLETED` when the order is closed out.

**Considered:** merging kitchen states into `OrderStatus` (rejected — breaks
payment gate, History, and export); ephemeral UI-only stages (rejected — SSE
multi-tab); strict linear one-step-only transitions (rejected — too many taps under
rush).
