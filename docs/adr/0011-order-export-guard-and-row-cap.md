# ADR-0011: Order export guard and row cap

Date: 2026-06-23  
Status: Accepted

## Context

Issue 04 adds CSV/XLSX export of the filtered History query and a printable
single-order receipt. Export is abuse-prone (large reads, spreadsheet generation)
while real vendor auth remains deferred (ADR-0009).

## Decision

### Guarded export route

- `GET /api/vendor/[slug]/export` requires a valid write secret.
- Client sends `X-Vendor-Write-Secret` header (preferred — avoids logging the
  secret in URLs). The route also accepts `writeSecret` query param for manual
  debugging.
- Missing/wrong secret → `403` JSON `{ code: "WRITE_SECRET_INVALID" }`.

### Same query as History

- Export calls `listOrdersFiltered` via `fetchAllFilteredOrders` in
  `lib/vendor/export-orders.ts`: probe with `pageSize: 1` for `total`, then
  fetch all matching rows in one call (`pageSize: total`). Not limited to the
  History UI page.

### Row cap

- **`EXPORT_MAX_ROWS = 10_000`**. When `total > 10_000`, return `413` JSON
  `{ code: "EXPORT_ROW_CAP", total, error }` with a message asking the vendor
  to narrow filters.
- Receipt pages stay unguarded reads (single order by id).

### Formats

- CSV: hand-rolled RFC 4180 escaping in `buildCsv`.
- XLSX: `exceljs`, worksheet name **"Order History"**.
- Columns align with History visible fields plus an items summary column.

### Receipt route

- New `app/vendor/[slug]/receipt/[orderId]/page.tsx` (vendor-scoped, branded
  `DESIGN.md` tokens + `@media print`). Legacy `app/slip/[orderId]` unchanged
  for driver slips.
- MoMo reference from `getPaymentForOrder` when payment status is `SUCCESS`.

## Consequences

- Operators must configure `VENDOR_WRITE_SECRET` before export works in prod.
- Very large histories require narrower date/status filters instead of one-shot
  full export.
- `exceljs` adds bundle weight to the export route only (not customer bundle).
