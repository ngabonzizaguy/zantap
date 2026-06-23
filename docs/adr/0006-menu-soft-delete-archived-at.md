# ADR-0006: Menu soft-delete via `archivedAt`

Date: 2026-06-23
Status: Accepted

## Context

Vendors need to remove dishes from the live menu and storefront without breaking
order history. `OrderItem.menuItem` is a required, non-cascading foreign key to
`MenuItem`. Hard-deleting a row that appears on past orders is blocked by
Postgres and would corrupt receipts, exports, and KDS history.

## Decision

- Add nullable `archivedAt` on `MenuItem`.
- **Delete = archive:** `archiveMenuItem` sets `archivedAt = now()`; `restoreMenuItem`
  clears it.
- **Read semantics:**
  - `getMenu` / KDS snapshot / default Menu tab → `archivedAt IS NULL`
  - `getAvailableMenu` → active + `isAvailable`
  - `getArchivedMenu` → `archivedAt IS NOT NULL`
- Order placement and availability toggles operate on active items only.
- Categories remain free-text; `renameCategory` bulk-updates active items.

## Consequences

- Storefront and live menu automatically hide archived rows without UI changes.
- Archived items stay joinable from historical `OrderItem` rows.
- Restore is a first-class vendor action (Archived filter in KDS Menu tab).
- Future `MenuImage` gallery (Issue 02) attaches to the same row; archive hides
  media from customer view without deleting blobs.
