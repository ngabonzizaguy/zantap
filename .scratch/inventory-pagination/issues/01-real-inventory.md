# Issue 01 — Real vendor Inventory

Status: ready-for-agent

## What to build

Deliver a separate, owner-token-protected Inventory for supplies rather than
finished dishes. A vendor can create an item, view it, edit its descriptive
fields, record safe quantity adjustments, inspect history, and archive/restore
it. The KDS surfaces clear low/out summaries, search, category filters, and ten
items per page, while Setup Guide opens Inventory and completes after the first
active item. Inventory is online-only and remains financially separate from the
Profit/Expenses screen.

## Acceptance criteria

- [ ] Both Store adapters support inventory item lifecycle, immutable adjustment
      history, archive/restore, filtering, status ordering and pagination.
- [ ] Supported units/categories and validation match the approved PRD;
      quantities support decimals where appropriate and never go below zero.
- [ ] KDS Inventory supports add, edit, Receive, Use, Waste, Correction,
      history and archive/restore with simple vendor-facing language.
- [ ] Low items are yellow, out items red, low/out counts are visible, and no
      external/paid WhatsApp call is introduced.
- [ ] Ten-item paging applies after search/category filtering and status order.
- [ ] Menu dish availability remains in Menu and is not presented as supply
      inventory; Profit and Expenses calculations remain unchanged.
- [ ] Setup Guide `Add your first stock item` opens Inventory and tracks real
      completion.
- [ ] Contract, validation, action, interaction, accessibility and responsive
      tests pass; migration is created but not deployed before the release gate.

## Blocked by

None — can start immediately.
