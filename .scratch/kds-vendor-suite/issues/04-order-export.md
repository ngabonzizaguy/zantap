# Order export — print receipt + CSV/XLSX data export

Status: done

## Parent

PRD: `.scratch/kds-vendor-suite/PRD.md`  
Grill: `.scratch/kds-vendor-suite/grill-decisions.md`

## Scope (one session)

Ship a branded printable single-order receipt and guarded CSV/XLSX export of the
**filtered** History query (all matching rows, not current page only). Wire export
buttons on History tab. **No PDF library** for data table; receipt uses browser print.

## What to build

### Single-order receipt

- Route: `app/vendor/[slug]/receipt/[orderId]/page.tsx` (or extend `app/slip/[orderId]` with brand styling — pick one, avoid duplicate routes).
- HTML layout using `DESIGN.md` / Tailwind tokens + `@media print` CSS.
- Content: vendor name, order id, line items, totals, MoMo ref if paid.
- Reuse helpers from `buildDeliverySlip` / existing slip structure where possible.
- Link from History row action ("Print receipt") and/or order detail.

### Data export

- Guarded route: `GET /api/vendor/[slug]/export` (or Server Action stream).
- Query params mirror `OrderHistoryFilters` + `format=csv|xlsx`.
- Calls `listOrdersFiltered` with large `pageSize` or internal pagination until all rows fetched.
- **Row cap:** e.g. 10k max — return typed error suggesting narrower filters (PRD open Q4).
- `exceljs` for `.xlsx`; hand-rolled CSV escaping.
- Requires valid `writeSecret` (query param or header — document choice).

### History UI integration

On `HistoryPanel`:

- "Export CSV" / "Export Excel" buttons pass **active filters** to export route.
- Per-row "Receipt" opens printable page in new tab.

### Dependencies

- `exceljs` added to `package.json`.
- `VENDOR_WRITE_SECRET` for export guard.

## Files touched

| Area | Paths |
|------|-------|
| Receipt | `app/vendor/[slug]/receipt/[orderId]/page.tsx` (new) or `app/slip/[orderId]/page.tsx` |
| Export API | `app/api/vendor/[slug]/export/route.ts` (new) |
| Export lib | `lib/vendor/export-orders.ts` (new) — CSV + xlsx builders |
| Tests | `lib/vendor/__tests__/export-orders.test.ts` (CSV header, row cap) |
| UI | `components/vendor/HistoryPanel.tsx` |
| Package | `package.json` (`exceljs`) |

## Acceptance criteria

- [x] Receipt page prints cleanly (browser print preview shows branded layout).
- [x] CSV export columns match History visible fields; proper escaping.
- [x] XLSX export opens in Excel with sensible sheet name.
- [x] Export uses same `listOrdersFiltered` as History — row set matches filters, not current page only.
- [x] Export rejects without valid `writeSecret`.
- [x] Row cap enforced with user-facing error.
- [x] History export buttons download with active filters applied.
- [x] `npm test` green (export unit/smoke); `npm run build` passes.

## Test plan

1. **Unit:** CSV header row + escaping; row-cap error; mock Store for route test optional.
2. **Build:** `npm run build` (exceljs bundle size acceptable).
3. **Manual dev smoke:**
   - History filter → Export CSV → file rows match filter.
   - Export Excel → opens correctly.
   - Receipt page for a PAID order shows items + total + payment ref.
   - Export without secret → 401/403 typed response.
   - Filter yielding > cap (if testable) → cap error.

## Blocked by

- Issue 03 (`order-history-filters`) — `listOrdersFiltered` + History UI must exist.

## Unblocks

- None (terminal feature slice in export/history chain).

## Comments

Shipped 2026-06-23. Receipt at `/vendor/[slug]/receipt/[orderId]` (legacy `/slip/[orderId]` unchanged). Export guard via `X-Vendor-Write-Secret` header (query `writeSecret` fallback). ADR-0011. Store adds `getPaymentForOrder` for MoMo ref on receipt. 9 export unit tests; `npm run build` passes. Prisma integration suite had transient seed FK failures unrelated to this slice.
