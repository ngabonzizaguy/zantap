# ADR-0036: Order item special-instructions notes persistence

Date: 2026-07-05
Status: Accepted
Builds on: ADR-0019 (customize modal), ADR-0035 (notes-only UI)

## Context

The storefront customize modal collects special-instructions notes per item
(ADR-0019 `CustomizationSelection.notes`). ADR-0035 slimmed the modal to images +
notes only; Issue 21-03 closes the gap where notes were discarded at the cart
adapter.

Owner decision (candidate #21): **one note per `menuItemId`**, last-write-wins if
the customer re-customizes the same dish. Ingredients/add-ons remain deferred.

## Decision

1. **Cart** — `CartContext` gains `itemNotes: Record<menuItemId, string>` and
   `addFromCustomization(selection)` (the single adapter from ADR-0019). Notes are
   trimmed and capped via `sanitizeItemNotes` (`CUSTOMIZATION_NOTES_MAX = 200`).
   Re-customize with empty notes clears the stored note; removing the last unit
   of an item clears its note.

2. **Checkout** — `CheckoutLine.notes` flows through `computeLines` →
   `executePay` → `CreateOrderInput.items[].notes`.

3. **Store / schema** — optional `OrderItem.notes` column (Prisma migration
   `20260705140000_order_item_notes`). Both adapters sanitize again at the trust
   boundary. Empty notes are not stored.

4. **KDS** — expanded `OrderTicket` renders notes in italic muted text under the
   line item. Checkout sheet shows notes for customer confirmation.

5. **Out of scope this issue** — receipt print, delivery slip, WhatsApp
   notification text (can pick up when those surfaces are touched).

## Consequences

- Kitchen staff see special instructions on paid tickets without a modifiers epic.
- Quick-add via `+` does not attach notes; only the customize path sets them.
- Future real modifiers epic extends line items; notes field is already on
  `OrderItem` and needs no reshape.
