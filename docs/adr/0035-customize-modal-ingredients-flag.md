# ADR-0035: Customize modal ingredients UI flag

Date: 2026-07-05
Status: Accepted
Supersedes: (partial) ADR-0019 scope item 1 — ingredients surface is hidden, not removed

## Context

ADR-0019 shipped a visual-only customize modal with ingredient toggles, add-ons,
notes, and a live display total. Candidate #21 owner review: the generic fallback
ingredients surface adds noise before a real modifier catalog exists; customers
mainly need photos and special instructions.

Notes persistence is deferred to Issue 21-03 (`OrderItem.notes`). The modifiers
epic remains future work.

## Decision

1. **`INGREDIENTS_UI_ENABLED = false`** in `lib/menu/customization.ts` (server-safe
   module). When false, `MenuItemCustomizeSheet` renders **images + notes only**.
2. **Keep all ADR-0019 forward-compat seams:** `IngredientOption` / `AddOnOption`
   types, `CustomizationSelection` payload, `resolveCustomization` generic fallback,
   `computeCustomizeTotal`, and the ingredients UI code path (behind the flag).
3. **Selection when flag off:** `removedIncludedIds` and `addOns` are always empty;
   `notes` and `qty` behave as before. Display total = base price × qty.
4. **No Store / cart / order changes** this issue — `onAddToOrder` still discards
   notes until 21-03.

Flip `INGREDIENTS_UI_ENABLED` to `true` to restore the full ADR-0019 ingredients
surface without code changes elsewhere.

## Consequences

- Customize modal is shorter and focused on gallery browsing + special instructions.
- Known gap from ADR-0019 (modifiers not persisted) narrows to notes-only until 21-03.
- Generic fallback catalog remains in code but is not user-visible while the flag is off.
