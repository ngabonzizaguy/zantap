# Issue 22-05 — Order driver assignment + call dispatch

Status: **Done** · Priority: 5 · ADR-0038

## Goal

Vendor assigns READY orders to drivers for record-keeping; call driver via `tel:`.
No WhatsApp in driver dispatch path. Order stays **READY** after assign (no stage
auto-advance).

## Locked behavior

- `Order.driverId` nullable FK → `Driver`.
- Single order: expanded READY ticket → pick driver → assign → show assigned driver
  + Call button (`tel:`).
- Bulk: select multiple READY orders → pick **one driver** → assign all.
- Dispatch modal refactor: assign + call; **remove** WhatsApp CTA for drivers.
- Keep **Notify vendor on WhatsApp** on PAID tickets (`OrderTicket.tsx`).
- History + ticket show assigned driver name when set.
- Assign does **not** change `kitchenStage` or `status`.

## What to build

### Data layer

- Migration: `Order.driverId` optional + relation.
- `Order` domain type + snapshot mappers include `driverId` + optional `driver`
  embed for display.
- `assignOrderDriver(orderId, driverId)` + `bulkAssignOrderDriver(orderIds, driverId)`
  owner-token guarded.
- KDS snapshot / SSE includes assignment.

### UI (match assign mockup — `ui-spec.md`)

- New `AssignDriverModal` (or refactor `DispatchModal`):
  - Bottom sheet, title `Assign driver to order #{displayId}`
  - Search drivers; status filter **Soon** (disabled)
  - Radio list (purple selected state), initials avatars
  - Orange CTA `Assign to {name}`
  - Footer: phone icon + "Call the driver after assigning" — **not** WhatsApp
- Bulk: title `Assign driver to {n} orders`; same picker; one driver → all
- Ticket: `Assigned: {name}` + Call (`tel:`) when `driverId` set
- `OUT_FOR_DELIVERY` remains separate (no auto-advance on assign)

## Files

| Area | Paths |
|------|-------|
| Schema | `prisma/schema.prisma`, migration |
| Store | `lib/store/types.ts`, `prisma.ts`, `in-memory.ts`, `__tests__/contract.ts` |
| Actions | `lib/actions/vendor-drivers.ts` or `vendor-orders.ts` |
| UI | `DispatchModal.tsx`, `OrderTicket.tsx`, `BulkActionBar.tsx`, `KdsDashboard.tsx`, `HistoryPanel.tsx` |

## Acceptance

- [x] Assign order A → driver X persists after refresh/SSE
- [x] Bulk assign 2+ READY orders → same driver on all
- [x] Order stays READY after assign (not OUT_FOR_DELIVERY)
- [x] Call opens `tel:` for assigned driver
- [x] No WhatsApp button in driver dispatch modal
- [x] Vendor WhatsApp notify on PAID unchanged
- [x] History shows driver when assigned
- [x] Contract tests green; `npm run build` clean

## Blocked by

22-04 (drivers must exist).

## Unblocks

Candidate #22 deploy + prod smoke.
