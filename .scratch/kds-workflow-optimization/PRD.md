# PRD — KDS Workflow Optimization

Status: Grilled 2026-06-24 · Ready for issue slicing
ADR: `docs/adr/0013-kds-kitchen-stage-orthogonal-to-order-status.md`
Grill: `.scratch/kds-workflow-optimization/grill-decisions.md`

## Problem

The Vendor KDS looks right but operates like a payment notification board. Raw minute
counts, no kitchen progress states, weak queue priority, no bulk handling, and
incomplete empty states limit production kitchen use.

## Goal

Upgrade operational efficiency and scalability **without** redesigning the dark KDS
aesthetic (charcoal theme, orange accent, existing cards, nav, layout).

## Domain decisions (locked)

1. **`kitchenStage`** orthogonal to **`OrderStatus`** (see ADR-0013).
2. **`paidAt`** anchors age display and urgency tiers.
3. **Forward-jump** stage transitions; bulk sets target stage; no backward.

## Functional requirements

### FR-1 Relative timestamps

Replace `"1424 min ago"` with intelligent relative labels from `paidAt`:
`Just now`, `N min ago`, `N hrs ago`, `Yesterday`, `N days ago`.

### FR-2 Kitchen workflow badges

Six stages: `NEW`, `ACCEPTED`, `PREPARING`, `READY`, `OUT FOR DELIVERY`, `COMPLETED`.
Kitchen badge primary; `PAID via MoMo` secondary. Mobile-friendly stage controls.

### FR-3 Aging urgency

From `paidAt` while active in kitchen: &lt;10m normal, 10–20m warning, 20m+ critical.
Subtle border/pulse — preserve premium aesthetic.

### FR-4 Queue sort

Primary: `kitchenStage` ordinal (NEW first … COMPLETED last).
Secondary: oldest `paidAt` first within group.

### FR-5 Inline expansion (extend existing)

Tap card → items, customer phone, sector + landmark. No separate detail route.

### FR-6 Scannable header row

Order #, kitchen stage, item count, total RWF, relative age — legible at distance.

### FR-7 Bulk operations

Multi-select; actions: Mark Preparing, Mark Ready, Mark Completed (target stage).
Server rejects backward transitions.

### FR-8 Empty / degraded states

Polished copy for: no active orders, kitchen closed, SSE offline/reconnecting,
payment processing (customer-side — informational if surfaced on vendor view).

### FR-9 Performance

No new polling. Optimistic UI for stage changes. Minimal animation.

## Non-goals

- Visual redesign or DESIGN.md token migration on Orders tab
- Merging kitchen stages into `OrderStatus`
- Auth / multi-user permissions
- Customer storefront changes

## Acceptance

- [ ] KDS shows kitchen stage badge above payment badge on active tickets
- [ ] Age labels human-readable; urgency tiers visible at 10m/20m thresholds
- [ ] Queue sorted by stage then oldest first
- [ ] Expanded ticket shows phone + items + delivery
- [ ] Bulk select updates multiple orders to a forward stage
- [ ] Dispatch still works; sets `DISPATCHED` + `OUT FOR DELIVERY`
- [ ] Contract tests + `npm run build` green
- [ ] Prod smoke: pay order → NEW on KDS → stage advance → dispatch → COMPLETED
