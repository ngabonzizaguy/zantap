# ADR-0071: Item-specific add-ons and server-priced order snapshots

Status: Accepted
Date: 2026-08-26

## Context

ADR-0019 left storefront add-ons as presentation-only placeholders. The owner
approved the follow-up proposal's five decisions: an in-modal Vendor subview;
Optional/Required and Single/Multiple group rules; limits of six groups and
twelve choices; free choices plus per-unit surcharge pricing; and item-specific
groups only for v1.

## Decision

- `MenuItem.addOnGroups` is an ordered JSON catalog. Groups and choices have
  stable IDs; choice IDs are unique across the item. A group is Optional or
  Required and Single or Multiple. Multiple groups carry a selection maximum.
- A MenuItem permits at most six groups and each group at most twelve choices.
  Choice prices are non-negative whole RWF amounts, so `0 RWF` is valid.
- The KDS editor opens Add-ons as a subview of the existing item modal. Back
  restores the unsaved item draft; saving the item replaces the catalog through
  the existing owner-token-guarded menu action and Store seam.
- The storefront renders enabled choices after size and before notes. Required
  groups block Add to order. Selected choices update the per-unit headline and
  quantity-aware CTA total immediately.
- Cart identity includes a canonical sorted add-on choice signature so the same
  dish/size with different selections remains separate.
- The browser sends choice IDs only. Both Store adapters resolve the current
  available catalog, enforce group rules, recalculate surcharges, and snapshot
  group/choice IDs, labels, and prices onto `OrderItem.addOnSelections`.
  `unitPriceRwf` is the complete per-unit size/base plus add-on price; quantity
  multiplies that amount once.
- KDS tickets, checkout, receipts, delivery/WhatsApp text, and CSV/XLSX exports
  show the immutable snapshot. Later Vendor edits cannot rewrite old Orders.

## Consequences

- The additive migration adds JSONB columns `MenuItem.addOnGroups` and
  `OrderItem.addOnSelections`; no join-table or reusable Vendor library is
  introduced in v1.
- JSON keeps the Store interface small and preserves ordered, item-owned drafts,
  while server validation prevents malformed catalogs from being persisted.
- A stale cart line is omitted if a required choice becomes missing or
  unavailable before checkout; the Customer must customize again.
- Shared/reusable add-on libraries, per-choice quantities, and ingredient
  removals remain deferred.
