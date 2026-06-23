# PRD: KDS Vendor Suite (menu CRUD, media, export, history filters, onboarding)

Status: ready-for-agent  
Feature slug: kds-vendor-suite  
Source: `/grill-with-docs` → `.scratch/kds-vendor-suite/grill-decisions.md`  
Design authority: `DESIGN.md` + `docs/adr/0005-elevenlabs-brand-design-system.md`

## Problem Statement

The Vendor KDS at `/vendor/[slug]` is a live-order console only. Vendors cannot
manage their menu beyond toggling availability, attach photos, review past orders
with filters, export receipts or data, or get guided setup help. The UI still
runs on the legacy `zk-*` dark-industrial palette while the brand has moved to
the ElevenLabs editorial system (ADR-0005).

| Gap today | Impact |
|-----------|--------|
| No menu create/edit/delete | Vendors must change seed data or DB to update items |
| `imageUrl` is a single optional string | No gallery, no upload path, gradient thumbs only |
| Orders tab shows live PAID+ only | No history view, no date/status/search filters |
| No export | Vendors cannot download receipts or order spreadsheets |
| No onboarding | Less-technical vendors lack in-app guidance |
| `zk-*` tokens in `components/vendor/*` | New features would ship on a deprecated design system |

All persistent reads and writes must continue through the **Store seam**
(`lib/store/`). No ad-hoc Supabase SDK paths. Abuse-prone writes need
guardrails while real vendor auth remains deferred.

## Solution

Ship five vendor-facing capabilities in one batch, built **natively** on a new
shared design-system foundation (Issue 0), under a four-section KDS information
architecture:

| Section | Replaces / adds | Core capability |
|---------|-----------------|-----------------|
| **Orders** | existing live tab | Unchanged live PAID/DISPATCHED queue + SSE |
| **Menu** | "Inventory" tab | Full CRUD, gallery, availability |
| **History** | new | Filtered past orders + export |
| **Setup / Guides** | new | Data-derived checklist + coachmarks |

Cross-cutting: deferred-auth model preserved; a shared **write-secret** env var
guards uploads and menu mutations; reads stay open.

## User Stories

### Foundation (Issue 0)

1. As a developer, I want `DESIGN.md` tokens in `tailwind.config.ts`, so every
   new surface uses one canonical palette instead of `zt-*` / `zk-*`.
2. As a developer, I want a small primitive kit (`Button`, `Input`, `Card`,
   `Modal`, `GradientOrbs`), so feature issues compose UI without one-off styles.
3. As a Vendor, I want the KDS to feel like the same brand as the storefront,
   so the product reads as one editorial system (large touch targets retained).

### Menu CRUD (Issue 1)

4. As a Vendor, I want to add menu items (name, price, description, category),
   so I can launch new dishes without a developer.
5. As a Vendor, I want to edit existing items, so prices and descriptions stay
   current.
6. As a Vendor, I want to "delete" an item by archiving it, so it disappears
   from the storefront and Menu list but order history stays intact.
7. As a Vendor, I want to view and restore archived items, so mistakes are
   recoverable.
8. As a Vendor, I want category typeahead from existing categories, so naming
   stays consistent without a rigid category table.
9. As a Vendor, I want to toggle availability inline (existing behavior), so
   sold-out control remains one tap.

### Media gallery (Issue 2)

10. As a Vendor, I want to upload photos for a menu item, so customers see real
    food instead of gradient placeholders.
11. As a Vendor, I want multiple images per item with one primary, so I can
    showcase the dish from several angles (carousel on storefront deferred).
12. As a Vendor, I want drag-to-reorder and set-primary, so the hero shot is
    under my control.
13. As a Vendor, I want to add an image by URL as a fallback, so I can link
    existing hosted photos.
14. As a Customer, I want the primary menu image on the storefront card, so the
    menu looks appetizing (carousel swipe deferred).

### History & filters (Issue 3)

15. As a Vendor, I want to browse past orders with date-range presets and custom
    from–to, so I can reconcile a shift or week.
16. As a Vendor, I want to filter by order status and payment status, so I can
    find unpaid or completed orders quickly.
17. As a Vendor, I want to search by phone or order id, so I can answer
    customer calls without scrolling.
18. As a Vendor, I want paginated results (newest first), so long histories stay
    fast.

### Export (Issue 4)

19. As a Vendor, I want a printable receipt for a single order, so I can hand a
    branded slip to a driver or customer.
20. As a Vendor, I want to export the **filtered** History list to CSV and XLSX,
    so I can reconcile in Excel or share with an accountant.
21. As a developer, I want export to call the same `listOrdersFiltered` query as
    History, so export rows always match what the filters imply.

### Onboarding guides (Issue 5)

22. As a less-technical Vendor, I want a setup checklist that auto-completes from
    real data (menu item exists, photo attached, kitchen open, first dispatch),
    so I know what is left to configure.
23. As a Vendor, I want dismissible coachmarks on key controls and a persistent
    "?" button, so I can reopen help anytime.
24. As a developer, I want guide progress derived from Store reads, not a server
    schema, so completion is correct across devices.

## Implementation Decisions

### Sequencing — foundation first

**Issue 0 must land before feature issues.** Every subsequent issue builds UI
only from the new primitive kit and `DESIGN.md` Tailwind tokens. Opportunistic
migration of legacy `zt-*` storefront / `zk-*` KDS surfaces is allowed but not
required in this batch; do not add new UI on legacy tokens.

Issue 0 deliverables:

- Translate `DESIGN.md` color, typography, spacing, radius tokens into
  `tailwind.config.ts` (e.g. `canvas`, `ink`, `hairline`, `gradient-mint`, …).
- Wire display font: **Instrument Serif** (already `--font-instrument-serif`) or
  add **EB Garamond** per `DESIGN.md`; **Inter** for body (add if not loaded).
- Create `components/ui/primitives/` (or `components/brand/`): `Button`
  (primary ink pill, outline), `Input`, `Card`, `Modal`, `Badge`, `GradientOrbs`.
- Deprecate `zt-*` / `zk-*` in comments; leave existing classes until migrated.

### Information architecture

Extend `KdsDashboard` nav from two tabs to four:

```
Orders | Menu | History | Setup
```

- **Orders** — current `OrdersList` + `DispatchModal` + SSE snapshot (no
  behavior regression).
- **Menu** — replaces `InventoryGrid`; adds list + editor + archived filter.
- **History** — new route section (client tab); server-paginated filtered list.
- **Setup** — side drawer + "?" affordance; not a full-page tab required.

Update `components/vendor/Tabs.tsx` (or replace with `KdsNav`) accordingly.

### Trust boundary — write-secret (deferred auth)

Real vendor authentication is **out of scope** (separate grill per `AGENTS.md`).
Abuse-prone writes are gated by a shared secret:

| Env var | Purpose |
|---------|---------|
| `VENDOR_WRITE_SECRET` | Server validation target |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob server uploads |

Client flow:

1. KDS shows a one-time setup prompt (or Settings row in Setup drawer) to enter
   the write-secret.
2. Secret stored in `localStorage` (key e.g. `zantap:vendor-write-secret`).
3. Guarded Server Actions accept `writeSecret: string` as first arg; server
   compares to `process.env.VENDOR_WRITE_SECRET` — reject with a typed error if
   missing/wrong.
4. **Reads stay unauthenticated** (`loadKdsSnapshot`, History list, guides
   checklist reads).

Guarded operations this batch:

- `createMenuItem`, `updateMenuItem`, `archiveMenuItem`, `restoreMenuItem`
- `uploadMenuImage`, `addMenuImageByUrl`, `reorderMenuImages`, `setPrimaryMenuImage`, `removeMenuImage`
- `exportOrders` (data export route/action)
- Category bulk-rename (if exposed)

Not guarded (existing): `toggleItem`, `resetMenu`, `setKitchen`, `advanceOrderStatus`
— keep current open model unless abuse appears; grill did not require gating these.

Helper: `lib/vendor/write-secret.ts` — `assertWriteSecret(secret: string)` throws
`WriteSecretError`; client hook `useWriteSecret()`.

### Data model — Prisma migration

#### MenuItem extensions

```prisma
model MenuItem {
  // ...existing fields...
  archivedAt  DateTime?
  images      MenuImage[]
  // imageUrl retained for backward compat during migration; primary image
  // URL should mirror MenuImage.isPrimary or be derived at read time
}
```

- `archivedAt: null` → active (visible in storefront + Menu list).
- `archivedAt: DateTime` → archived (hidden from `getAvailableMenu` and default
  Menu list; visible under Archived filter; retained on `OrderItem.menuItem`).

#### MenuImage (new)

```prisma
model MenuImage {
  id          String   @id @default(cuid())
  menuItemId  String
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  url         String
  blobPath    String?  // Vercel Blob pathname for deletion; null for URL-added images
  sortOrder   Int      @default(0)
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([menuItemId])
}
```

Invariant: exactly one `isPrimary: true` per item when images exist; enforce in
Store on add/reorder/set-primary/remove.

#### Domain types (`lib/types.ts`)

```ts
export interface MenuImage {
  id: string;
  menuItemId: string;
  url: string;
  blobPath?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface MenuItem {
  // ...existing...
  archivedAt?: Date;
  images?: MenuImage[];
}

export interface OrderHistoryFilters {
  datePreset?: "today" | "yesterday" | "last7" | "last30" | "custom";
  dateFrom?: Date;
  dateTo?: Date;
  status?: OrderStatus | "ALL";
  paymentStatus?: Payment["status"] | "ALL";
  search?: string; // phone substring or order id fragment
}

export interface Pagination {
  page: number;      // 1-based
  pageSize: number;  // default 20
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Store interface extensions (`lib/store/types.ts`)

**Menu reads** — update semantics:

- `getMenu(vendorSlug)` → active (non-archived) items, with `images` hydrated.
- `getAvailableMenu(vendorSlug)` → active + `isAvailable` + has primary image
  logic unchanged for availability; exclude archived.
- `getArchivedMenu(vendorSlug)` → `archivedAt != null`.
- `getMenuItem(vendorSlug, itemId)` → single item or null.

**Menu writes** (new):

```ts
createMenuItem(vendorSlug, input: CreateMenuItemInput): Promise<MenuItem>;
updateMenuItem(vendorSlug, itemId, input: UpdateMenuItemInput): Promise<MenuItem | null>;
archiveMenuItem(vendorSlug, itemId): Promise<MenuItem | null>;
restoreMenuItem(vendorSlug, itemId): Promise<MenuItem | null>;
renameCategory(vendorSlug, from: string, to: string): Promise<number>; // rows updated
```

**MenuImage writes** (new):

```ts
addMenuImage(vendorSlug, itemId, input: AddMenuImageInput): Promise<MenuImage>;
uploadMenuImageBlob(vendorSlug, itemId, file: Buffer, mime: string): Promise<MenuImage>;
reorderMenuImages(vendorSlug, itemId, imageIds: string[]): Promise<MenuImage[]>;
setPrimaryMenuImage(vendorSlug, itemId, imageId: string): Promise<MenuImage | null>;
removeMenuImage(vendorSlug, itemId, imageId: string): Promise<boolean>;
```

**Order history read** (new):

```ts
listOrdersFiltered(
  vendorSlug: string,
  filters: OrderHistoryFilters,
  pagination: Pagination
): Promise<PaginatedOrders>;
```

Both adapters + contract tests for every new method. `fetchKdsSnapshot` continues
to use live-order paths; History uses `listOrdersFiltered` with complementary
filters (include COMPLETED, all statuses per filter, not KDS-gated).

### Feature 1 — Menu CRUD (detail)

- **Delete = archive.** `archiveMenuItem` sets `archivedAt = now()`. Storefront
  `getAvailableMenu` and Menu default list exclude archived.
- **Restore** clears `archivedAt`.
- **Categories** — free-text `category` string; editor typeahead from
  `getCategories(vendorSlug)`; optional `renameCategory` bulk-updates items.
- **Validation:** `name` required; `priceRwf` integer > 0; `description`
  optional; `category` defaults to `"General"`.
- **UI:** Menu list cards (primary image or gradient fallback), "+" create,
  tap-to-edit sheet/modal, archive with confirm, Archived toggle/filter tab.
- **Server Actions** in `lib/actions/vendor-menu.ts` (or extend `vendor.ts` if
  small — prefer separate file to avoid bloating the KDS action module).

### Feature 2 — Media gallery (detail)

- **Storage:** `@vercel/blob` server-side upload in a guarded action; returns
  CDN URL + pathname stored in `blobPath`.
- **Limits:** max 6 images/item, ~5 MB each, `image/jpeg` | `image/png` |
  `image/webp`; reject over-limit before Blob put.
- **Primary:** first uploaded image defaults primary; user can change; storefront
  and KDS Menu card read `images.find(i => i.isPrimary)?.url ?? imageUrl ?? gradient`.
- **Reorder:** client drag-and-drop updates `sortOrder` via `reorderMenuImages`.
- **Remove:** `removeMenuImage` deletes Blob when `blobPath` set; reassign primary
  if needed.
- **URL add:** `addMenuImage` with external `url`, `blobPath: null`.
- **No-image fallback:** auto-assign `thumbFrom`/`thumbTo` from a fixed palette
  (hash item id → gradient pair); not vendor-editable this batch.
- **Customer scope:** primary image only on storefront card; carousel deferred.

### Feature 3 — History filters (detail)

- **Server-side** `listOrdersFiltered` in both adapters.
- **Filters:**
  - Date presets: Today, Yesterday, Last 7, Last 30, Custom (from–to dates).
  - `status`: PENDING | PAID | DISPATCHED | COMPLETED | ALL.
  - `paymentStatus`: PENDING | SUCCESS | FAILED | ALL (join `Payment` when set).
  - `search`: case-insensitive match on `customerPhone` or order id suffix.
- **Sort:** `createdAt DESC`.
- **Pagination:** default `pageSize: 20`; return `total` for pager UI.
- **UI:** History tab with filter bar, results table/cards, page controls.
- Time-of-day within a day = **deferred**.

### Feature 4 — Export (detail)

**Single-order receipt**

- Printable route e.g. `app/vendor/[slug]/receipt/[orderId]/page.tsx` (or extend
  `app/slip/[orderId]` with brand styling).
- **Tech:** HTML + `@media print` CSS using `DESIGN.md` tokens — browser
  print-to-PDF; no `pdfkit`/`puppeteer` dependency.
- Reuse line-item structure from `buildDeliverySlip` / order display helpers;
  elevate to full branded receipt layout (vendor name, items, totals, MoMo ref if
  paid).

**Data export**

- Guarded route `GET /api/vendor/[slug]/export` (or Server Action returning
  stream) with query params mirroring `OrderHistoryFilters` + `format=csv|xlsx`.
- Implementation: `exceljs` for `.xlsx`, hand-rolled CSV escaping.
- Calls `listOrdersFiltered` with `pageSize` large enough to export all matching
  rows (or paginate internally); **not** limited to current History page.
- History UI: "Export CSV" / "Export Excel" buttons pass active filters.

### Feature 5 — Guides / onboarding (detail)

- **Side drawer** (`SetupDrawer`) styled with primitive kit; opens from Setup tab
  or persistent "?" FAB in KDS chrome.
- **Checklist steps** (example; finalize in issue):

  | Step | Auto-complete when |
  |------|-------------------|
  | Add a menu item | `getMenu(slug).length > 0` |
  | Add a photo | any item has `images.length > 0` |
  | Open kitchen | `isKitchenOpen(slug) === true` |
  | Receive first order | any order with status PAID+ exists |
  | Dispatch an order | any order DISPATCHED or COMPLETED |

- **Coachmarks:** lightweight anchored tooltips on first visit (Menu +, kitchen
  toggle, dispatch button); dismissal in `localStorage`
  (`zantap:kds-coachmark-*`).
- **No server persistence** for guide state beyond real data.

### KDS snapshot adjustment

`fetchKdsSnapshot` / live Orders tab: keep filtering to
`PAID | DISPATCHED | COMPLETED`. Menu portion should return active items only
(non-archived). Optionally include `primaryImageUrl` in snapshot for Menu tab
thumbnails without N+1 client fetches.

## Testing Decisions

- **Contract suite:** extend `lib/store/__tests__/contract.ts` for every new Store
  method (archive/restore, images, `listOrdersFiltered`).
- **Write-secret:** unit test `assertWriteSecret` rejects wrong/missing secret.
- **MenuImage invariants:** primary uniqueness, max 6 images, cascade delete.
- **listOrdersFiltered:** preset date boundaries (use fixed clock or inject dates
  in in-memory adapter tests).
- **Export:** smoke test CSV header row + xlsx sheet name; mock Store in route
  test if needed.
- **No Playwright** in this batch; manual smoke per issue.
- **`npm run build`** after any `"use server"` file changes (prod export rule).
- Keep `npm test` green; Prisma suite auto-skips without `TEST_DATABASE_URL`.

## Environment & ops

| Variable | Required | Notes |
|----------|----------|-------|
| `VENDOR_WRITE_SECRET` | prod + dev | Long random string; share with vendor offline |
| `BLOB_READ_WRITE_TOKEN` | prod + dev | Vercel Blob RW token |
| `DATABASE_URL` / `DIRECT_URL` | existing | Migration for `archivedAt`, `MenuImage` |

Document in `.env.example` (no real secrets). Add to Vercel project env before
deploying media/export issues.

## ADRs to write during implementation

| ADR | Topic |
|-----|-------|
| 0006 (suggested) | Menu soft-delete via `archivedAt` |
| 0007 (suggested) | Vercel Blob as menu media storage |
| 0008 (suggested) | `MenuImage` gallery model |
| 0009 (suggested) | Deferred-auth write-secret guardrail |

ADR-0005 already records the brand system decision.

## Out of Scope (explicit)

- Real vendor authentication / per-vendor tokens (separate grill + PRD).
- Storefront image carousel (gallery data captured; UI follow-up).
- Time-of-day filtering within a date.
- PDF export of the data table (receipt print-to-PDF only).
- Full storefront / legacy KDS visual migration (opportunistic only).
- Live MTN MoMo callback changes.
- Zod/Prisma type-source refactor (candidate #5).

## Open Questions (resolve in Issue 0 or 01)

1. **Display font:** Instrument Serif vs EB Garamond — pick one in Issue 0 and
   load via `next/font`.
2. **KDS canvas:** full light editorial canvas vs dark elevated panels for order
   tickets — `DESIGN.md` has `surface-dark` tokens if kitchen glare is a concern;
   default leaning light editorial per ADR-0005.
3. **`imageUrl` deprecation:** derive primary URL from `MenuImage` at read time
   and stop writing `imageUrl`, or dual-write during migration? Leaning: dual-write
   primary URL to `imageUrl` for backward compat until storefront migrates.
4. **Export row cap:** safety limit (e.g. 10k rows) to prevent abuse? Leaning: yes,
   with error message suggesting narrower filters.

## Dependencies

- Store seam (candidate #1) ✅
- Payment module (candidate #2) ✅ — History `paymentStatus` filter
- KDS live push (candidate #4) ✅ — Orders tab unchanged
- `DESIGN.md` + ADR-0005 ✅

## Issues (planned)

Ship **one issue per session** (anti-YOLO). Foundation must complete first.

| # | Slug | Delivers | Depends on |
|---|------|----------|------------|
| 00 | `design-system-foundation` | `tailwind.config.ts` tokens, fonts, primitive kit (`Button`, `Input`, `Card`, `Modal`, `GradientOrbs`) | — |
| 01 | `menu-crud-store-and-ui` | `archivedAt` migration, Store CRUD verbs, guarded actions, Menu tab UI (create/edit/archive/restore, typeahead categories) | 00 |
| 02 | `menu-media-gallery` | `MenuImage` migration, Vercel Blob upload, gallery UI, primary/reorder/remove/URL add, storefront primary image | 01 |
| 03 | `order-history-filters` | `listOrdersFiltered` + adapters + contract tests, History tab UI with pagination | 00 |
| 04 | `order-export` | Print receipt page, CSV/XLSX export route reusing `listOrdersFiltered`, History export buttons | 03 |
| 05 | `vendor-onboarding-guides` | Setup drawer, data-derived checklist, coachmarks, `localStorage` dismissal, "?" affordance | 00, 01 (checklist reads menu) |

### Suggested session read order

1. This PRD + `grill-decisions.md`
2. `DESIGN.md` + ADR-0005
3. `lib/store/types.ts`, `lib/types.ts`, `prisma/schema.prisma`
4. `components/vendor/*`, `lib/actions/vendor.ts`
5. Issue file for the active slice (created by `/to-issues`)

## Acceptance (batch-level)

- [ ] Issue 0: new UI in vendor features uses `DESIGN.md` tokens only
- [ ] Four-section KDS nav: Orders, Menu, History, Setup
- [ ] Menu CRUD with soft-delete; archived items restorable; storefront excludes archived
- [ ] Gallery up to 6 images/item on Vercel Blob; primary on storefront card
- [ ] History filters server-side + paginated; export matches filters
- [ ] Receipt printable via browser; CSV + XLSX download works
- [x] Guides checklist reflects live Store state; coachmarks dismissible
- [ ] Guarded writes reject without valid `VENDOR_WRITE_SECRET`
- [ ] Both Store adapters + contract tests green; `npm run build` passes
- [ ] ADRs 0006–0009 recorded as issues land
