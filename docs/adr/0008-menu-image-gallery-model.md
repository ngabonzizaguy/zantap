# ADR-0008: MenuImage gallery model

Date: 2026-06-23
Status: Accepted

## Context

Menu items previously stored a single optional `imageUrl`. Vendors need up to
six photos per dish with one primary hero image for the storefront and KDS
cards. Storefront carousel is deferred; gallery data is captured now.

## Decision

- New **`MenuImage`** Prisma model: `url`, optional `blobPath`, `sortOrder`,
  `isPrimary`, FK to `MenuItem` with `onDelete: Cascade`.
- Store verbs: `addMenuImage`, `uploadMenuImageBlob`, `reorderMenuImages`,
  `setPrimaryMenuImage`, `removeMenuImage` — both adapters + contract tests.
- **Invariants (Store-enforced):**
  - Max **6** images per item.
  - Exactly one `isPrimary: true` when images exist.
  - First image defaults primary; removing primary promotes the next by sort order.
- **Dual-write:** primary URL mirrored to `MenuItem.imageUrl` for backward compat
  until all readers use `images`.
- **Reads:** `getMenu`, `getAvailableMenu`, `getArchivedMenu`, `getMenuItem`
  hydrate `images` ordered by `sortOrder`.
- **Migration:** existing non-empty `imageUrl` values become a primary `MenuImage`
  row (`blobPath: null`).
- **UI:** `MenuImageGallery` in the menu editor (upload, URL add, drag reorder,
  set primary, remove). Storefront/KDS cards resolve
  `images.find(i => i.isPrimary)?.url ?? imageUrl ?? gradient`.

## Consequences

- Order history keeps menu snapshots via `OrderItem.menuItem`; images on archived
  items remain in DB but hidden from customer menu reads.
- Issue 05 checklist step “Add a photo” can use `images.length > 0`.
- Carousel follow-up can reuse gallery rows without schema change.
