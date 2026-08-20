# ADR-0061: Real vendor Inventory is separate from Menu stock

Status: Accepted locally — 2026-08-20 (not deployed)

## Decision

ZanTap Inventory models vendor supplies independently from sellable `MenuItem`
dishes. `InventoryItem` stores name, decimal quantity, resolved unit label,
low-stock threshold, approved category, optional reference unit cost and note,
plus an archive timestamp. `InventoryAdjustment` is append-only and records a
per-item sequence, Received/Used/Wasted/Correction type, entered quantity,
old/new quantities, optional note, and timestamp.

The Store remains the only server data seam. Both in-memory and Prisma adapters
implement the same seven Inventory verbs. Quantity writes validate at most three
decimal places and never permit stock below zero; RWF unit cost is a whole number.
Prisma records the item update and history row together in a serializable
transaction, retrying write conflicts. A creation records its opening quantity as
the first Correction so the complete quantity story is preserved.

Inventory listing owns search, category/archive filtering, active low/out counts,
safe page clamping, and the locked sort order: out first, low second, then healthy
items alphabetically. Pages contain ten items. Inventory URL state uses
`tab=inventory` plus `inventoryPage`, `inventorySearch`, `inventoryCategory`, and
`inventoryArchived`.

All Inventory mutations cross async-only Server Actions and require the vendor's
owner token. The feature is online-only and adds no offline mutation queue. Low
and out alerts remain in-app. Inventory never decrements from orders, calls
WhatsApp, charges fees, or contributes to Profit, food cost, or Expenses.

## Consequences

- Menu availability and legacy dish-level stock remain Menu concerns; the former
  Stock tab is no longer reachable as supply inventory.
- Setup Guide completion is based on the first active Inventory item and routes
  directly to the Inventory tab.
- Archived items retain their immutable adjustment history and can be restored.
- Migration `20260820183000_real_vendor_inventory` must be reviewed and applied at
  the combined release gate; creating this ADR and implementation does not
  authorize deployment.
- Future recipe deduction, staff identity attribution, offline writes, and the
  opt-in rate-limited combined WhatsApp alert require separate decisions.
