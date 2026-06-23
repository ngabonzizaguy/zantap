# KDS Vendor Suite — Grilling Decisions

Date: 2026-06-23
Status: Grilled, PRD ready for `/to-issues`
Source: `/grill-with-docs` session

The resolved decision tree for the next batch of KDS vendor features. This is the
input for `/to-prd`. Read alongside `CONTEXT.md`, `DESIGN.md`, and ADR-0005.

## Scope (the batch)

Five features for the Vendor KDS, built in the new brand design system:
1. Menu CRUD (items)
2. Media (gallery) for menu items — upload primary, URL secondary
3. Export — per-order receipt PDF + filtered-orders data export (xlsx/CSV)
4. Order History filters
5. Onboarding guides for less-technical vendors

## Cross-cutting decisions

- **Design system → ElevenLabs (editorial), brand-wide.** `DESIGN.md` is the single
  source of truth for ALL UI (storefront + KDS). See ADR-0005. `getdesign add` only
  ships the `DESIGN.md` spec — tokens/components are hand-built into `tailwind.config.ts`.
  The committed `DESIGN.md` is the **light editorial** variant (off-white, ink, Waldenburg
  serif, Inter, pastel orbs); ignore getdesign's "dark cinematic" blurb.
- **Sequencing → Foundation first.** Issue 0 = wire `DESIGN.md` tokens into Tailwind +
  build a shared primitive kit (Button, Input, Card, Modal, gradient Orbs) in the new
  system. Every feature is built natively on it. Existing storefront/KDS migrate
  opportunistically afterward. Legacy `zt-*`/`zk-*` palettes are deprecated (don't build
  new UI on them).
- **Trust boundary → deferred-auth + guardrails.** Keep the no-login model (per AGENTS.md;
  real auth is a separate grill). Protect abuse-prone writes: upload size/type/count limits
  + a shared **write-secret** (one env var; entered once in KDS, kept in `localStorage`,
  sent with guarded write actions; server validates against env). Reads stay open.
- **Information architecture → four sections.** KDS nav grows to: **Orders** (live, unchanged),
  **Menu** (CRUD + media; replaces "Inventory"), **History** (past orders + filters + export),
  **Setup/Guides**.
- **Fonts.** Waldenburg is licensed → pick a display substitute in Issue 0 (Instrument Serif
  already loaded via `--font-instrument-serif`, or add EB Garamond per `DESIGN.md`). Inter for body.

## Feature 1 — Menu CRUD

- **Delete = soft-delete/archive.** Add `archivedAt` to `MenuItem`. "Delete" archives:
  item leaves storefront + Menu list, stays intact for order history/exports. Add an
  "Archived" filter to restore. (Forced by `OrderItem.menuItem` being a required, non-cascading
  relation — hard delete of a used item is blocked by Postgres and would corrupt history.)
- **Categories = free-text with typeahead.** `category` stays a string; editor suggests existing
  categories and allows new ones. Rename = bulk-update items. No new table.
- **Fields/validation (defaults):** `name` required; `priceRwf` integer > 0; `description`
  optional; `category` via typeahead; availability toggle retained.
- Requires: extend `Store` interface (create/update/archive/restore menu item) + both adapters
  (in-memory, Prisma) + guarded Server Actions; new `archivedAt` migration.

## Feature 2 — Media (gallery)

- **Storage backend = Vercel Blob** (`@vercel/blob`). Server-side upload via a guarded Server
  Action; returns a CDN URL. New env: `BLOB_READ_WRITE_TOKEN`. No public client-side upload.
  (Chosen over Supabase Storage to respect the "no ad-hoc Supabase SDK" rule and keep the data seam clean.)
- **Gallery, not single image.** New `MenuImage` model: `id`, `menuItemId` (FK, cascade),
  `url`, stored blob path (for deletion), `sortOrder`, `isPrimary`, `createdAt`. Store methods
  + both adapters + migration.
- **Customer display scope = primary now, carousel later.** Storefront card + KDS show the
  PRIMARY image only this batch; a swipeable storefront carousel is a separate follow-up issue.
  Gallery data is captured from day one.
- **Defaults:** max ~6 images/item, ~5MB each, jpeg/png/webp, drag-to-reorder, first image =
  primary (changeable), remove also deletes the Blob, "add by URL" as secondary path.
- **No-image fallback:** auto-assign `thumbFrom`/`thumbTo` gradient from a palette (not vendor-edited).

## Feature 3 — Export

- **Both** a polished single-order **receipt** (downloadable) and a **data export** of the
  filtered History list to **.xlsx + CSV**.
- **Receipt tech = browser print-to-PDF** (HTML + print CSS, reuses `DESIGN.md`/Tailwind directly
  — pixel-perfect brand match, no PDF dependency). Builds on existing `app/slip/[orderId]` +
  `SuccessReceipt.tsx` + `buildDeliverySlip`.
- **Data tech = exceljs (.xlsx) + hand-rolled CSV**, via a guarded server route that reads the
  **same filtered query** as History (all matching rows, not just the current page).
- PDF of the data table = optional/later.

## Feature 4 — History filters

- **Server-side query + pagination.** New Store read method
  `listOrdersFiltered(slug, { dateRange, status, paymentStatus, search }, pagination)` + both
  adapters. Filters: date-range presets (Today/Yesterday/Last 7/30/Custom from–to), status,
  text search (phone/order id), newest-first, paginated.
- **Export reuses the exact same query.**
- Literal time-of-day filtering = deferred (date-range covers day/date).

## Feature 5 — Guides / onboarding

- **Bespoke side-drawer, data-derived checklist + coachmarks.** DESIGN.md-styled drawer (reuses
  primitive kit) with a setup checklist whose steps **auto-complete by reading real state**
  (has a menu item? has a photo? kitchen open? first order dispatched?). Dismissible tooltip
  coachmarks on key controls. A persistent "?" button reopens it.
- **Persistence = `localStorage`** (dismissed/last step) only; completion derives from actual
  data → cross-device-correct, no schema change, no new deps.

## Likely ADRs to write during PRD/implementation

- Menu soft-delete (`archivedAt`) data-integrity decision.
- Vercel Blob as media storage (lock-in).
- `MenuImage` gallery model.
- Deferred-auth write-secret guardrail pattern.

(ADR-0005 already records the brand/design-system decision.)

## Open/deferred (explicitly NOT in this batch)

- Real vendor authentication (separate grill+PRD per AGENTS.md).
- Storefront image carousel (follow-up issue).
- Time-of-day order filtering.
- PDF of the data/report table.
- Per-vendor write tokens (arrive with real auth).
