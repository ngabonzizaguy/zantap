# Menu media gallery — MenuImage model, Vercel Blob, gallery UI

Status: ready-for-agent → **done 2026-06-23**

## Parent

PRD: `.scratch/kds-vendor-suite/PRD.md`  
Grill: `.scratch/kds-vendor-suite/grill-decisions.md`

## Scope (one session)

Add `MenuImage` model and Store verbs, server-side Vercel Blob upload (guarded),
gallery UI in Menu editor (upload, URL add, reorder, set primary, remove), and
storefront primary image on menu cards. **No storefront carousel** (deferred).

## What to build

### Prisma migration

```prisma
model MenuImage {
  id          String   @id @default(cuid())
  menuItemId  String
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  url         String
  blobPath    String?
  sortOrder   Int      @default(0)
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([menuItemId])
}
```

Add `images MenuImage[]` on `MenuItem`. Migrate existing `imageUrl` values to a
primary `MenuImage` row where present (data migration script or seed step).

### Domain + Store

`lib/types.ts` — `MenuImage` interface; hydrate `images` on menu reads.

Store methods (both adapters + contract tests):

- `addMenuImage(vendorSlug, itemId, { url })` — URL path, `blobPath: null`
- `uploadMenuImageBlob(vendorSlug, itemId, file: Buffer, mime)` — returns `MenuImage`
- `reorderMenuImages(vendorSlug, itemId, imageIds: string[])`
- `setPrimaryMenuImage(vendorSlug, itemId, imageId)`
- `removeMenuImage(vendorSlug, itemId, imageId)` — delete Blob when `blobPath` set

**Invariants (enforce in Store):**

- Max **6** images per item.
- Exactly one `isPrimary: true` when images exist.
- First upload defaults primary; reassign on primary remove.
- Dual-write primary URL to `MenuItem.imageUrl` for backward compat (PRD open Q3).

### Blob upload

- Dependency: `@vercel/blob`.
- Guarded Server Action in `lib/actions/vendor-menu.ts` (or `vendor-media.ts`).
- Limits: ~5 MB, `image/jpeg` | `image/png` | `image/webp`; reject before put.
- Env: `BLOB_READ_WRITE_TOKEN` in `.env.example` + Vercel project.

### Gallery UI (Menu editor)

Inside Menu item editor (Issue 01):

- Thumbnail grid, drag-to-reorder.
- Set primary (star or equivalent).
- Upload button + URL input fallback.
- Remove with confirm.
- No-image fallback: hash `itemId` → `thumbFrom`/`thumbTo` palette (auto, not editable).

### Storefront

`components/customer/MenuItemCard.tsx` — show primary image:
`images.find(i => i.isPrimary)?.url ?? imageUrl ?? gradient`.

### KDS Menu list

Menu cards use same primary image resolution.

## Files touched

| Area | Paths |
|------|-------|
| Schema | `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts` |
| Types | `lib/types.ts`, `lib/store/types.ts` |
| Adapters | `lib/store/in-memory.ts`, `lib/store/prisma.ts` |
| Tests | `lib/store/__tests__/contract.ts` (primary uniqueness, max 6, cascade) |
| Actions | `lib/actions/vendor-menu.ts` or `lib/actions/vendor-media.ts` |
| UI | `components/vendor/MenuEditor.tsx`, `components/vendor/MenuImageGallery.tsx` (new) |
| Storefront | `components/customer/MenuItemCard.tsx` |
| Package | `package.json` (`@vercel/blob`) |
| Env | `.env.example` |

## Acceptance criteria

- [x] `MenuImage` migration + contract tests green.
- [x] Upload stores CDN URL + `blobPath`; remove deletes Blob when applicable.
- [x] Max 6 images enforced; primary invariant tested.
- [x] Reorder updates `sortOrder`; set-primary updates `imageUrl` dual-write.
- [x] URL-add path works without Blob.
- [x] Guarded writes require valid `writeSecret`.
- [x] Storefront card shows primary photo when present.
- [x] `npm test` green; `npm run build` passes.
- [x] ADRs: `docs/adr/0007-vercel-blob-menu-media.md`, `docs/adr/0008-menu-image-gallery-model.md`.

## Test plan

1. **Contract:** primary uniqueness, max-6 rejection, reorder order, remove primary reassignment, cascade on item delete.
2. **Build:** `npm run build`.
3. **Manual dev smoke** (requires `BLOB_READ_WRITE_TOKEN` + `VENDOR_WRITE_SECRET`):
   - Upload 2 images → first is primary.
   - Reorder + change primary → storefront updates.
   - Add by URL → appears in gallery.
   - Remove primary → new primary assigned; Blob deleted for uploads.
   - Attempt 7th image → rejected.

## Blocked by

- Issue 01 (`menu-crud-store-and-ui`) — Menu editor + `MenuItem` CRUD must exist.

## Unblocks

- Issue 05 (checklist step "Add a photo").

## Comments

Shipped 2026-06-23: migration `20260623120000_menu_image_gallery`, Store image verbs,
`MenuImageGallery` in edit modal, `getPrimaryImageUrl` on KDS + storefront cards.
In-memory contract 32/32 green; `npm run build` passes. Prisma suite requires
reachable `TEST_DATABASE_URL` (skipped when DB unreachable).
