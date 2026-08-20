# Issue 01 — Real vendor Inventory

Status: ✅ DONE locally 2026-08-20 — verified in isolated slice, not deployed

## What to build

Deliver a separate, owner-token-protected Inventory for supplies rather than
finished dishes. A vendor can create an item, view it, edit its descriptive
fields, record safe quantity adjustments, inspect history, and archive/restore
it. The KDS surfaces clear low/out summaries, search, category filters, and ten
items per page, while Setup Guide opens Inventory and completes after the first
active item. Inventory is online-only and remains financially separate from the
Profit/Expenses screen.

## Acceptance criteria

- [x] Both Store adapters support inventory item lifecycle, immutable adjustment
      history, archive/restore, filtering, status ordering and pagination.
- [x] Supported units/categories and validation match the approved PRD;
      quantities support decimals where appropriate and never go below zero.
- [x] KDS Inventory supports add, edit, Receive, Use, Waste, Correction,
      history and archive/restore with simple vendor-facing language.
- [x] Low items are yellow, out items red, low/out counts are visible, and no
      external/paid WhatsApp call is introduced.
- [x] Ten-item paging applies after search/category filtering and status order.
- [x] Menu dish availability remains in Menu and is not presented as supply
      inventory; Profit and Expenses calculations remain unchanged.
- [x] Setup Guide `Add your first stock item` opens Inventory and tracks real
      completion.
- [x] Contract, validation, action, interaction, accessibility and responsive
      tests pass; migration is created but not deployed before the release gate.

## Blocked by

None — can start immediately.

## Verification

- Focused Inventory Store contract: 5 passed (100 unrelated skipped).
- Focused actions + Setup Guide: 15 passed.
- TypeScript: clean.
- ESLint: clean.
- Full Vitest: 354 passed / 109 expected skips.
- Production build: clean.
- Local browser smoke: 390×844 and 1280×900, zero console errors and no
  horizontal overflow. Create, low alert, Receive, history, negative-stock
  rejection, archive/restore, URL state, and Setup completion passed.
- Migration `20260820183000_real_vendor_inventory` exists on disk and was not
  applied. Production was not touched.
