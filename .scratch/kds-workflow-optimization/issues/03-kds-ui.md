# KDS workflow UI — badges, aging, sort, bulk, empty states

Status: done

## Parent

PRD: `.scratch/kds-workflow-optimization/PRD.md`  
Blocked by: Issues 01–02

## Scope (one session)

Operational UI on existing dark KDS cards — **no visual redesign.** Kitchen badge
dominant over payment badge; relative time from `paidAt`; urgency tiers; queue sort;
phone in expand; multi-select bulk bar; empty/degraded copy.

## What to build

### Format (`lib/format.ts`)

- `formatRelativeTime(paidAt)` — Just now / N min ago / hrs / Yesterday / days
- Urgency helper for normal / warning / critical tiers

### KDS read (`lib/kds/snapshot.ts` or client sort)

- Sort: `kitchenStage` ordinal, then `paidAt` ASC

### UI (`OrderTicket.tsx`, `KdsDashboard.tsx`, bulk bar component)

- Kitchen stage badge (primary) + payment badge (secondary)
- Relative age + subtle urgency styling while before `OUT_FOR_DELIVERY`
- Stage chips / forward actions (call Issue 02 actions)
- Expand: customer phone + existing items/delivery
- Bulk select footer: Mark Preparing / Ready / Completed
- Empty states: kitchen closed, SSE offline, all caught up

## Acceptance criteria

- [x] No `zk-*` palette changes; charcoal + orange preserved
- [x] Dispatch modal still sets `OUT FOR DELIVERY` via stage action
- [x] Prod smoke: pay → NEW → advance stages → dispatch → COMPLETED
- [x] `npm run build` green

## Comments
