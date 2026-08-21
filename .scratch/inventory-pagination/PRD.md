# Real Inventory and 10-item pagination

Status: DONE · MERGED TO MAIN · DEPLOYED · PROD-SMOKED 2026-08-21
Branch: `codex/inventory-pagination` from stable launch commit `df9d530`

## Goal

Replace the misleading dish-count Stock experience with a separate, simple
vendor Inventory for supplies, and keep KDS/storefront lists usable by limiting
them to ten visible records per page.

## Locked inventory decisions

- Inventory is separate from Menu. Examples: Rice (3 bags), Tomato sauce
  (12 bottles), takeaway boxes (50 pieces).
- Manual inventory first; orders do not deduct recipe ingredients.
- Item fields: name, quantity, unit, low-stock threshold, category, optional
  unit cost and note. Categories: Ingredients, Drinks, Packaging, Cleaning,
  Other. Units: pieces, packs, boxes, bags, bottles, kg, litres, custom.
- Quantity changes are recorded adjustments: Received, Used, Wasted,
  Correction. Quantity cannot go below zero. History records old/new quantity,
  type, note and timestamp. Items with history are archived, not destroyed.
- Inventory screen provides summary, search, category filter, add action,
  item details/edit/adjust/history/archive, and ten items per page. Sort order:
  out first, then low, then remaining items alphabetically.
- Yellow means low; red means out. KDS shows low/out counts. In-app alerts ship
  now. No paid WhatsApp integration; future WhatsApp delivery should be an
  opt-in combined alert at most once every 30 minutes, sent to the setup phone.
- Inventory costs are reference-only and do not change Profit, Food costs, or
  Expenses. Updates are owner-token protected and online-only.
- Setup Guide gains `Add your first stock item`; Menu setup remains separate.
- History does not claim an employee identity until staff accounts exist.

## Locked pagination decisions

- Live KDS Orders and Order History show ten records per page after filtering
  and sorting. Filter changes return to page 1.
- New orders belong on page 1; vendors on later pages see a new-order notice
  instead of having the page reshuffled. Empty pages clamp backward.
- Bulk selection is limited to the ten visible orders and clears on page change.
- KDS tab, stage, sort and page live in the URL.
- Storefront shows ten available dishes after category/search filtering.
  Previous/Page/Next controls preserve the cart and scroll to the menu heading.
  Category, search and page live in the URL; invalid pages clamp safely.

## Release boundary

Three isolated implementation commits, one production deployment only after
Store contracts, focused UI tests, TypeScript, lint, full tests, production
build, mobile/desktop smoke, migration review and production smoke pass.
