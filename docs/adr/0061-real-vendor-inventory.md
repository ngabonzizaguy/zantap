# ADR-0061: Real vendor Inventory is separate from Menu stock

Status: Accepted · DONE · deployed 2026-08-20 · prod-smoked 2026-08-21

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
- Migration `20260820183000_real_vendor_inventory` was reviewed, applied once and
  verified before deployment `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi`.
- The final production harness passed the guarded Inventory lifecycle and direct
  Postgres history checks; independent fixture cleanup and 48-hour deployment
  error/fatal/5xx scans were clean. No migration repeat or redeploy was needed.
- Future recipe deduction, staff identity attribution, offline writes, and the
  opt-in rate-limited combined WhatsApp alert require separate decisions.
- Release closeout `7028e5b` was later fast-forwarded to `main` and deployed as
  `dpl_874DQNUcV2fG7eXsbtLeFTqdeJJd` on 2026-08-21. Route checks and the
  initial exact-deployment error scan passed; neither migration nor production
  harness was repeated.
