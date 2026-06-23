# Order history filters — `listOrdersFiltered` + History tab UI

Status: done

## Parent

PRD: `.scratch/kds-vendor-suite/PRD.md`  
Grill: `.scratch/kds-vendor-suite/grill-decisions.md`

## Scope (one session)

Add server-side filtered, paginated order history via `listOrdersFiltered` in both
Store adapters, contract tests, and a **History** tab in KDS with filter bar + pager.
**No export** (Issue 04). Live **Orders** tab behavior unchanged (still PAID+ SSE queue).

## What to build

### Domain types (`lib/types.ts`)

```ts
export interface OrderHistoryFilters {
  datePreset?: "today" | "yesterday" | "last7" | "last30" | "custom";
  dateFrom?: Date;
  dateTo?: Date;
  status?: OrderStatus | "ALL";
  paymentStatus?: Payment["status"] | "ALL";
  search?: string; // phone substring or order id fragment
}

export interface Pagination {
  page: number;      // 1-based
  pageSize: number;  // default 20
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Store interface

```ts
listOrdersFiltered(
  vendorSlug: string,
  filters: OrderHistoryFilters,
  pagination: Pagination
): Promise<PaginatedOrders>;
```

**Semantics:**

- Sort: `createdAt DESC`.
- Include **all** statuses per filter (not KDS live gate); default status `ALL`.
- Date presets compute start/end of day in server timezone (document choice).
- `paymentStatus` joins `Payment` when set.
- `search`: case-insensitive `customerPhone` or order id suffix match.
- Time-of-day within a day = **out of scope**.

Implement in-memory + Prisma; extend contract suite with fixed dates or injectable clock.

### Server Action / RSC read

`lib/actions/vendor-history.ts` or read helper called from History tab (reads **unauthenticated**).

### History tab UI

Using primitive kit:

- Filter bar: date presets + custom from–to, status select, payment status select, search input.
- Results table or cards (order id, phone, status, payment, total, createdAt).
- Pagination controls (`total`, page size 20).
- Empty state when no matches.

Wire **History** tab in `KdsDashboard` / `Tabs.tsx`.

## Files touched

| Area | Paths |
|------|-------|
| Types | `lib/types.ts`, `lib/store/types.ts` |
| Adapters | `lib/store/in-memory.ts`, `lib/store/prisma.ts` |
| Tests | `lib/store/__tests__/contract.ts` |
| Actions | `lib/actions/vendor-history.ts` (new) |
| UI | `components/vendor/HistoryPanel.tsx` (new), `components/vendor/OrderHistoryFilters.tsx` (new), `components/vendor/KdsDashboard.tsx`, `components/vendor/Tabs.tsx` |

**Do not touch:** export routes, `exceljs`, receipt pages.

## Acceptance criteria

- [x] `listOrdersFiltered` implemented in both adapters with contract coverage.
- [x] Date presets (today, yesterday, last7, last30, custom) return correct boundaries in tests.
- [x] Status + paymentStatus + search filters compose correctly.
- [x] Pagination returns correct `total` and page slice; default `pageSize: 20`.
- [x] History tab renders filtered results; changing filters resets to page 1.
- [x] Live Orders tab + SSE unchanged (`fetchKdsSnapshot` still PAID/DISPATCHED/COMPLETED gate).
- [x] UI uses primitive kit only.
- [x] `npm test` green; `npm run build` passes.

## Test plan

1. **Contract:** preset boundaries, status filter, payment join, search by phone and id fragment, pagination math, empty results.
2. **Build:** `npm run build`.
3. **Manual dev smoke:**
   - Open History tab → sees seeded past orders.
   - Preset "Today" / "Last 7" narrows results.
   - Search by phone fragment finds order.
   - Filter `COMPLETED` only → pager updates.
   - Orders tab still shows live queue with SSE.

## Blocked by

- Issue 00 (`design-system-foundation`) — History UI uses primitive kit.

## Unblocks

- Issue 04 (`order-export`) — export reuses `listOrdersFiltered`.

## Comments
