# KDS Workflow Optimization — Grilling Decisions

Date: 2026-06-24
Status: Grilled — ready for `/to-issues` + implementation
Source: `/grill-with-docs` session
ADR: `docs/adr/0013-kds-kitchen-stage-orthogonal-to-order-status.md`

## Scope (preserve visual identity — operational upgrade only)

Evolve the existing Vendor KDS (`/vendor/[slug]`, dark charcoal + orange accent,
`OrderTicket` card language) into a production-grade kitchen ops tool. **No visual
redesign.** Touch-first, mobile-first, minimal animation, SSE performance unchanged.

## Resolved decision tree

### Q1 — Where do kitchen workflow states live?

**Decision: Option B — orthogonal `kitchenStage` field on `Order`.**

- Keep `OrderStatus` for payment/dispatch: `PENDING | PAID | DISPATCHED | COMPLETED`.
- Add `KitchenStage` enum + `kitchenStage` column; default `NEW` when order becomes `PAID`.
- KDS primary badge = `kitchenStage`; secondary badge = payment (`PAID via MoMo`).
- `fetchKdsSnapshot` visibility gate unchanged (`PAID`, `DISPATCHED`, `COMPLETED` only).

### Q2 — What clock drives order aging?

**Decision: Option C — `paidAt` on `Order`, set once at `PAID` transition.**

- Human-readable relative time (`Just now`, `2 min ago`, `1 hr ago`, `Yesterday`) from `paidAt`.
- Urgency tiers: normal &lt;10m, warning 10–20m, critical 20m+ (subtle visual — no color explosion).
- Aging suppressed once `kitchenStage` is `OUT_FOR DELIVERY` or `COMPLETED`.
- Do **not** use `createdAt` (includes pre-payment MoMo PIN wait).

### Q3 — Stage transition rules (single + bulk)?

**Decision: Option B + B1 — forward jump to target stage; no backward.**

- Single-order: stage chips/actions set a target stage directly.
- Bulk: "Mark Preparing / Ready / Completed" sets selected orders to that stage (if currently earlier).
- Server validates monotonic forward order on enum ordinal; rejects backward.
- `OUT FOR DELIVERY` ↔ existing dispatch flow: sets `OrderStatus` `DISPATCHED` + driver slip modal.
- Closing order: `kitchenStage` `COMPLETED` + `OrderStatus` `COMPLETED`.

## Mapping table (default)

| Event | `OrderStatus` | `kitchenStage` | Notes |
|-------|---------------|----------------|-------|
| Customer places order | `PENDING` | — (null or unset) | Not KDS-visible |
| MoMo confirms | `PAID` | `NEW` | Set `paidAt` |
| Staff accepts | `PAID` | `ACCEPTED` | |
| Cooking | `PAID` | `PREPARING` | |
| Plated | `PAID` | `READY` | |
| Driver dispatched | `DISPATCHED` | `OUT_FOR_DELIVERY` | Existing dispatch modal |
| Done | `COMPLETED` | `COMPLETED` | |

## PRD items — already vs net-new

| # | Requirement | Baseline | Net-new work |
|---|-------------|----------|--------------|
| 1 | Human-readable timestamps | Raw `minutesAgo` integer | `formatRelativeTime(paidAt)` in `lib/format.ts` |
| 2 | Kitchen workflow states | Payment/dispatch badges only | `kitchenStage` schema + Store + UI badges + actions |
| 3 | Order aging indicators | None | Urgency styling on ticket from `paidAt` tiers |
| 4 | Queue prioritization | Undispatched first | Sort by `kitchenStage` ordinal, then `paidAt` ASC |
| 5 | Quick inline expansion | Items + sector/landmark | Add `customerPhone` to expanded panel |
| 6 | Scannable ops data | Partial | Promote stage badge, age, count, total |
| 7 | Bulk operations | None | Multi-select + bulk stage server action |
| 8 | Empty states | "All caught up" only | Kitchen closed, offline/SSE, payment processing copy |
| 9 | Performance | SSE live push OK | Optimistic updates; no heavy animation |

## Store / API surface (planned)

- `updateKitchenStage(orderId, stage)` — single order, forward-only validation.
- `bulkUpdateKitchenStage(orderIds, stage)` — same validation per id.
- Extend `confirmPayment` / `updateOrderStatus(…, PAID)` to set `paidAt` + `kitchenStage: NEW`.
- Backfill migration: existing `PAID` orders → `kitchenStage NEW`, `paidAt = updatedAt` or `createdAt` fallback; `DISPATCHED` → `OUT_FOR DELIVERY`; `COMPLETED` → `COMPLETED`.

## UI constraints (non-negotiable)

- Keep `zk-*` dark KDS palette and orange accent on Orders tab (no DESIGN.md migration this batch).
- Kitchen badge visually dominant over green "PAID via MoMo" pill.
- Bulk mode: simple checkbox/select on cards; sticky footer with stage actions.

## Out of scope (this batch)

- Customer view changes
- Real MoMo callback (still simulate)
- Auth beyond existing write-secret
- History tab column for `kitchenStage` (optional follow-up)
- Per-stage aging (`kitchenStageUpdatedAt`) — rejected in grill

## Affected files (implementation estimate)

| Layer | Files |
|-------|-------|
| Schema | `prisma/schema.prisma`, new migration |
| Types | `lib/types.ts` (`KitchenStage`, `paidAt`, `kitchenStage` on `Order`) |
| Store | `lib/store/types.ts`, `in-memory.ts`, `prisma.ts`, `contract.ts` tests |
| Actions | `lib/actions/vendor.ts` (+ bulk action) |
| KDS read | `lib/kds/snapshot.ts`, `lib/kds/fingerprint.ts` (if snapshot shape changes) |
| Format | `lib/format.ts` (`formatRelativeTime`, urgency helper) |
| UI | `components/vendor/OrderTicket.tsx`, `OrdersList`, `KdsDashboard.tsx`, new bulk bar |
| Payment | confirm path in store adapters (set `paidAt` + initial stage) |
