# ADR-0069: Dynamic menu size options and immutable order snapshots

Status: Accepted
Date: 2026-08-25

## Context

Some restaurant menus price the same dish differently by portion size. The KDS
editor must default to Small, Medium, and Large while also supporting the
reference design's functional rename, reorder, visibility, delete, reset, and
custom-size controls. Fixed `smallPrice`/`mediumPrice`/`largePrice` columns would
not represent that behavior and would make every new tier a schema change.

Checkout must also remain money-correct when a vendor edits or disables a size
after a customer has added it to a cart, and historical orders must retain the
label and price that were purchased.

## Decision

- `MenuItem` stores an ordered JSON list of two to eight size options. Each
  option has a stable lower-case ID, editable label, positive integer RWF price,
  and storefront availability flag.
- Absence of the list preserves the existing single-price behavior.
- `MenuItem.priceRwf` remains the canonical starting price and is derived from
  the cheapest enabled size whenever size pricing is saved.
- Server-side validation enforces unique IDs and case-insensitive labels, valid
  prices, the option-count bounds, and at least one enabled option.
- Cart identity combines menu item ID and size option ID so two sizes of the
  same dish can coexist as separate lines.
- Order creation accepts only the option ID. The Store resolves that ID against
  the current enabled menu option and snapshots its ID, label, and unit price on
  `OrderItem`; client-submitted prices are never trusted.
- Storefront, checkout, KDS, receipt, WhatsApp, and export views use the stored
  order snapshot for historical display.

## Alternatives considered

- Fixed Small/Medium/Large columns: rejected because it contradicts the
  functional custom-size editor and cannot represent renamed or reordered rows.
- A relational `MenuItemSize` child table: deferred because size options are a
  small aggregate always read and replaced with its parent. JSON keeps Store
  adapter parity and makes ordered atomic edits simple. It can be normalized if
  per-size inventory, analytics, or independent updates become requirements.
- Client-calculated order prices: rejected because stale or modified clients
  could submit an incorrect amount.

## Consequences

- Editing the list is an atomic whole-list update; individual options are not
  independently queryable in SQL.
- Existing single-price records require no backfill.
- Production rollout requires applying the additive JSON and order-snapshot
  migration before deploying code that writes these fields.
- Per-size stock, cost, and modifier rules remain out of scope and would require
  a follow-up domain decision.
