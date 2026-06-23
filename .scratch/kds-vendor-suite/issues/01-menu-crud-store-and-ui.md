# Menu CRUD — Store seam, migration, guarded actions, Menu tab UI

Status: done

## Parent

PRD: `.scratch/kds-vendor-suite/PRD.md`  
Grill: `.scratch/kds-vendor-suite/grill-decisions.md`

## Scope (one session)

Soft-delete menu items via `archivedAt`, extend the Store with create/update/archive/restore
(+ optional `renameCategory`), wire guarded Server Actions with write-secret, and replace
`InventoryGrid` with a full **Menu** tab (list, create, edit, archive, restore, category
typeahead). **No image gallery** (Issue 02). **No History/Export/Guides** UI beyond nav slot.

## What to build

### Prisma migration

Add to `MenuItem`:

```prisma
archivedAt DateTime?
```

Run migration. Update seed if needed so demo menu stays active.

### Domain types (`lib/types.ts`)

- `archivedAt?: Date` on `MenuItem`.
- `CreateMenuItemInput`, `UpdateMenuItemInput` (name, priceRwf, description?, category?).

### Store interface (`lib/store/types.ts`)

**Read semantics (update):**

- `getMenu(slug)` → active items only (`archivedAt == null`).
- `getAvailableMenu(slug)` → active + `isAvailable` (exclude archived).
- `getArchivedMenu(slug)` → `archivedAt != null`.
- `getMenuItem(slug, itemId)` → single item or null.

**Writes (new):**

- `createMenuItem(vendorSlug, input)`
- `updateMenuItem(vendorSlug, itemId, input)`
- `archiveMenuItem(vendorSlug, itemId)` — sets `archivedAt = now()`
- `restoreMenuItem(vendorSlug, itemId)` — clears `archivedAt`
- `renameCategory(vendorSlug, from, to)` — bulk update; optional in UI

Implement in **both** `lib/store/in-memory.ts` and `lib/store/prisma.ts`.
Extend `lib/store/__tests__/contract.ts`.

### Write-secret guardrail

- `lib/vendor/write-secret.ts` — `assertWriteSecret(secret)`, `WriteSecretError`.
- `lib/vendor/useWriteSecret.ts` — client hook; `localStorage` key `zantap:vendor-write-secret`.
- One-time setup prompt in KDS (or Setup row stub) to enter secret.
- Env: `VENDOR_WRITE_SECRET` documented in `.env.example`.

Guarded actions (first arg `writeSecret: string`):

- `createMenuItem`, `updateMenuItem`, `archiveMenuItem`, `restoreMenuItem`, `renameCategory` (if exposed)

**Not guarded** (keep existing): `toggleItemAvailability`, `setAllItemsAvailable`, `setKitchenOpen`, `advanceOrderStatus`.

### Server Actions

New file `lib/actions/vendor-menu.ts` (`"use server"` — **export only async functions**, no type re-exports per AGENTS.md).

### KDS UI — Menu tab

Replace `InventoryGrid` with Menu section using **primitive kit only**:

- List cards (gradient thumb fallback until Issue 02).
- "+" create → modal/sheet with validation (name required, `priceRwf` integer > 0, category typeahead from `getCategories`, default `"General"`).
- Tap-to-edit same fields.
- Archive with confirm dialog.
- **Archived** filter/tab with restore action.
- Retain inline availability toggle (existing behavior).

Update `components/vendor/KdsDashboard.tsx` + `Tabs.tsx` (or `KdsNav`) for **Menu** tab label.

### Storefront

`getAvailableMenu` must exclude archived items (no UI change required if read path is correct).

### KDS snapshot

`fetchKdsSnapshot` menu portion: active items only; optional `primaryImageUrl` stub from `imageUrl` until Issue 02.

## Files touched

| Area | Paths |
|------|-------|
| Schema | `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts` |
| Types | `lib/types.ts`, `lib/store/types.ts` |
| Adapters | `lib/store/in-memory.ts`, `lib/store/prisma.ts` |
| Tests | `lib/store/__tests__/contract.ts`, `lib/vendor/__tests__/write-secret.test.ts` (new) |
| Actions | `lib/actions/vendor-menu.ts` |
| Write-secret | `lib/vendor/write-secret.ts`, `lib/vendor/useWriteSecret.ts` |
| KDS UI | `components/vendor/KdsDashboard.tsx`, `components/vendor/InventoryGrid.tsx` (replace/rename), `components/vendor/Tabs.tsx`, new `components/vendor/MenuEditor.tsx`, `components/vendor/MenuList.tsx` (names flexible) |
| KDS read | `lib/kds/snapshot.ts` (active menu filter) |
| Env | `.env.example` |

## Acceptance criteria

- [x] `archivedAt` migration applied; contract tests cover archive/restore.
- [x] Archived items hidden from storefront `getAvailableMenu` and default Menu list.
- [x] Archived items visible under Archived filter; restore works.
- [x] Create/edit validation enforced server-side and in UI.
- [x] Category typeahead suggests existing categories; new names allowed.
- [x] Guarded actions reject missing/wrong `writeSecret`; unit test for `assertWriteSecret`.
- [x] Availability toggle still works without write-secret.
- [x] Menu tab uses primitive kit tokens only (no new `zk-*`).
- [x] `npm test` green; `npm run build` passes after `"use server"` changes.
- [x] ADR drafted: `docs/adr/0006-menu-soft-delete-archived-at.md`, `docs/adr/0009-deferred-auth-write-secret.md`.

## Test plan

1. **Contract:** `npm test` — archive/restore, create/update, `getMenu` vs `getArchivedMenu`, storefront exclusion.
2. **Write-secret:** unit tests wrong/missing/valid secret.
3. **Build:** `npm run build`.
4. **Manual dev smoke:**
   - Set `VENDOR_WRITE_SECRET` in `.env`; enter in KDS prompt.
   - Create item → appears on Menu + storefront.
   - Archive → disappears from storefront; visible in Archived; restore reverses.
   - Edit price → reflects on storefront.
   - Toggle availability without secret still works.
   - Wrong secret → typed error, no mutation.

## Blocked by

- Issue 00 (`design-system-foundation`) — primitives + tokens required.

## Unblocks

- Issue 02 (gallery attaches to existing items).
- Issue 05 (checklist step "Add a menu item").

## Comments
