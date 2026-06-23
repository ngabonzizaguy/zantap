# ADR-0010: Order history filter semantics

Date: 2026-06-23  
Status: Accepted

## Context

Issue 03 of the KDS Vendor Suite adds `listOrdersFiltered` for paginated vendor
order history. Filters must compose (date, status, payment, search) and stay
consistent across in-memory and Prisma adapters. Export (Issue 04) will reuse
the same query.

## Decision

### Store method

`listOrdersFiltered(vendorSlug, filters, pagination)` returns
`PaginatedOrders` with `OrderHistoryItem[]` — each row includes the `Order`
plus joined `paymentStatus` (or `null` when no `Payment` row exists).

### Sort and scope

- Sort: `createdAt DESC` (newest first).
- **All order statuses** are eligible (not KDS live gate). Default status
  filter is `ALL`.
- Live Orders tab continues to use `fetchKdsSnapshot` / `listActiveOrders`
  (PAID/DISPATCHED/COMPLETED gate unchanged).

### Date presets

Calendar-day boundaries use **`Africa/Kigali`** (CAT, UTC+2, no DST) via
`lib/orders/history-filters.ts`:

| Preset | Range |
|--------|-------|
| `today` | Start → end of current Kigali day |
| `yesterday` | Start → end of previous Kigali day |
| `last7` | Start of day 6 days ago → end of today (7 inclusive days) |
| `last30` | Start of day 29 days ago → end of today (30 inclusive days) |
| `custom` | Inclusive start/end of `dateFrom` / `dateTo` in Kigali |

Time-of-day within a day remains out of scope.

### Payment status filter

When `paymentStatus` is set (not `ALL`), filter via `Payment` join. Orders
without a payment row do not match any specific payment status.

### Search

Case-insensitive substring on `customerPhone` or full `order.id`, plus match on
the last four numeric characters of the order id (supports `#1204` style lookup).

### Pagination

- `page` is 1-based; default `pageSize` is **20** when unset or ≤ 0.
- Return `total` for pager UI; slice after all filters in both adapters.

## Consequences

- Vendors in Rwanda see shift/day boundaries aligned to local calendar days.
- Issue 04 export can call the same helper with a large `pageSize` or internal
  pagination loop.
- Unit tests pin preset boundaries with a fixed clock; contract tests cover
  adapter behavior.
