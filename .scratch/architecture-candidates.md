# Architecture candidates — backlog index

Source: `/improve-codebase-architecture` review (recovered from session transcript
`5e22d701-4923-4f9b-80ba-5c1a99150bea`, which rendered the five candidates as an
HTML report). This file is the durable, session-independent record so the backlog
is never lost again.

> Note: `.scratch/` is local and gitignored (per `AGENTS.md` issue-tracker
> convention — local markdown, no GitHub round-trips). It persists on this machine
> across sessions, but does **not** sync via git to other clones/machines.

Last verified against the codebase: 2026-06-24.

## Open production issues (read before touching the KDS)

- **Known issue 0001 — closed 2026-06-24.** Symptom B (reload crash) fixed via
  `reviveSnapshot` date revival in `useKdsLiveSnapshot.ts`; hard refresh `200` in
  candidate #6 prod smoke. Symptom A (wrong stream URL → "Vendor not found") is
  user error / generic 404 copy — **polished + deployed 2026-06-24** (`app/not-found.tsx` +
  `app/error.tsx` → DESIGN.md tokens; prod curl: wrong stream path → "Page not found").
  Full record: `docs/known-issues/0001-kds-page-couldnt-load-and-stream-url.md`.

## Session handoff protocol (agents: read this in EVERY candidate session)

Sessions are run one-at-a-time and kept token-light; a new session inherits only
what is on disk, never the previous chat. Therefore every session MUST end by:

1. **Persisting state to disk** (the source of truth across sessions):
   - tick the relevant issue file checkboxes and update its Status line;
   - update the status table in this file;
   - record any design decisions as an ADR under `docs/adr/` (git-tracked, so
     decisions survive across machines even though `.scratch/` does not).
2. **Printing the next session's prompt** — a single copy/paste-ready fenced
   code block that states: what was just completed, what comes next, and exactly
   which files the next agent should read. The user starts the next session by
   pasting it verbatim.

If a session ends without doing both, the handoff is incomplete.

## Status legend

- ✅ Done — shipped (committed/pushed/deployed)
- 📋 Queued — PRD + issues written, implementation not started
- ⏳ Backlog — identified, not started
- ◑ Partially superseded — some of its value already delivered by another candidate

## Overview

| # | Candidate | Review rating | Scope | Status | PRD |
|---|-----------|---------------|-------|--------|-----|
| 1 | Collapse the data layer behind a server-only seam | Strong | — | ✅ Done & deployed | `.scratch/data-layer-server-seam/PRD.md` |
| 2 | Deepen payments into a Payment module | Strong | server | ✅ Done | `.scratch/payment-module-idempotent-momo/PRD.md` |
| 3 | Extract a Checkout module from the Storefront UI | Worth exploring | in-process (client) | ✅ Done | `.scratch/checkout-module/PRD.md` |
| 4 | Give the KDS a real orders interface | Worth exploring | ports & adapters | ✅ Done | `.scratch/kds-live-push/PRD.md` |
| 5 | Make Prisma the type source; Zod at the seam | Speculative | — | ◑ Audited — deferred | `.scratch/prisma-type-source/PRD.md` |
| 6 | KDS Vendor Suite (menu, media, export, history, guides) | Strong | ports & adapters | ✅ Done & deployed · smoke complete | `.scratch/kds-vendor-suite/PRD.md` |
| 7 | KDS workflow optimization (kitchen stage, aging, bulk) | Strong | ports & adapters + KDS UI | ✅ Done & deployed · smoke complete | `.scratch/kds-workflow-optimization/PRD.md` |
| 8 | Storefront menu image carousel | Strong | customer UI only | ✅ Done · deployed · prod-smoked 2026-06-27 | `.scratch/storefront-image-carousel/PRD.md` |
| 9 | Vendor WhatsApp PAID notification | Worth exploring | customer + lib/whatsapp | ⏸ Probe — deferred | — |
| 10 | Customer storefront → DESIGN.md | Strong | customer UI | ⏸ Owner designs pending | — |
| 11 | Live MTN MoMo integration | Strong | server + payments | ⏸ Requires `/grill-with-docs` | — |
| 12 | Vendor authentication | Strong | server + KDS | ⏸ Requires `/grill-with-docs` | — |
| 13 | Ops / security hardening | Worth exploring | docs + infra | ⏸ Probe — deferred | — |
| 14 | Storefront item customization modal (visual-only) | Owner request | customer UI only | ✅ Done · mockup polish `764e916` · `dpl_2gR9gDbnH1oic5qzz5qqjTYzrPDx` → `zantap-psi.vercel.app` 2026-06-28 | `.scratch/storefront-customization-modal/PRD.md` |

Candidates **#1–#7** shipped. **#8** sliced 2026-06-24. **#9–#13** probed; gates noted.

---

## #1 · Collapse the data layer behind a server-only seam — ✅ DONE

The foundational slice. One server-only `Store` interface with two adapters
(in-memory + Prisma/Postgres), chosen by a factory on `DATABASE_URL`. Shipped
across three issues (Store seam, Prisma adapter+migration+seed, factory +
dual-adapter contract suite), verified 34/34 tests green against Supabase, and
deployed to production (`DATABASE_URL`/`DIRECT_URL` set in Vercel Production).

Everything below assumes this single-writer foundation.

---

## #2 · Deepen payments into a Payment module — ✅ DONE

Persist `Payment` rows and make MoMo confirmation an idempotent state machine
behind the Store, killing the module-scoped `pendingTransactions` Map in
`lib/momo/simulate.ts` (the same realm/serverless split-brain #1 fixed, but for
money). PRD + 3 issues written. **Grilled 2026-06-22** — decisions in
`docs/adr/0001-payment-module-idempotent-momo.md`. **Issue 01 shipped 2026-06-22**
(Store payment verbs + in-memory adapter + payment contract suite).
**Issue 02 shipped 2026-06-22** (Prisma adapter payment verbs + transactional
confirm + payment contract on disposable DB + cross-instance durability test).
**Issue 03 shipped 2026-06-22** (rewired `lib/momo/simulate.ts` through Store,
deleted `pendingTransactions` Map, added simulate integration tests — 53/53
tests green).

- PRD: `.scratch/payment-module-idempotent-momo/PRD.md`
- Issues: `01-payment-in-store-idempotent-transition`,
  `02-payment-prisma-adapter`, `03-wire-momo-through-store-remove-map`
- Recommended before any new payment-touching feature (live correctness bug).

---

## #3 · Extract a Checkout module from the Storefront UI — ✅ DONE

Rating: Worth exploring · Scope: in-process (client-side refactor).

**Issue 01 shipped 2026-06-22** — `lib/checkout/` pure domain (validation + totals +
14 unit tests); `canProceedToPay` removed from `CheckoutSheet`; `CONTEXT.md`
adds Checkout term. 67/67 tests green.

**Issue 02 shipped 2026-06-22** — stage machine (`stages.ts`), injectable MoMo client
(`momo-client.ts`), orchestration helpers (`orchestration.ts`), `useCheckout` hook;
17 new unit tests (stages + orchestration). 84/84 tests green.

**Issue 03 shipped 2026-06-22** — slimmed `CartContext` to cart-only (`cart`,
`addItem`, `removeItem`, `resetCart`); `StorefrontInner` wires UI through
`useCheckout(vendor, menu)`; deleted inline `handlePay` / `handleConfirmPin`;
`sectorOpen` is local UI state in Storefront. 84/84 tests green. Manual dev smoke
(menu → cart → MoMo → success → reset) recommended before commit.

- PRD: `.scratch/checkout-module/PRD.md`
- Issues: `01-checkout-pure-domain`, `02-checkout-orchestration-hook`,
  `03-wire-storefront-slim-cart`

---

## #4 · Give the KDS a real orders interface — ✅ DONE

Rating: Worth exploring · Scope: ports & adapters.

**Shipped 2026-06-22** — replaced client 5s polling with SSE live push. Server
reads through `fetchKdsSnapshot` (Store seam); fingerprint skips redundant
frames; `useKdsLiveSnapshot` hook in `KdsDashboard`. ADR-0002. 88/88 tests
green. Manual smoke: customer checkout in one tab → PAID order on KDS within ~1s.

**Production-hardened 2026-06-23** — the long-lived SSE route was killed at
Vercel's ~300s max duration, flooding logs with "Vercel Runtime Timeout Error:
Task timed out" (known-issue 0002 Symptom C). Fixed transport-only: the route
self-closes at `MAX_STREAM_MS = 250_000` via one idempotent `teardown()` with
`export const maxDuration = 300`, and `useKdsLiveSnapshot` now owns reconnect
with exponential backoff (1s→15s, reset on `onopen`). Deployed to prod
2026-06-23 (`dpl_CcKFimVQaQg87wc9rQmhSdkF48S1`). Verified: prod SSE returns the
correct PAID-gated snapshot; held connections self-close cleanly (curl exit 0,
no kill); CLI runtime logs show only `200`/`info` on `kds-stream`, zero "Task
timed out". ADR-0004. Candidate #4 is now closed out (feature + prod hardening).

- PRD: `.scratch/kds-live-push/PRD.md`
- Issues: `01-sse-stream-replace-polling`
- ADRs: `docs/adr/0002-kds-live-push-sse.md`, `docs/adr/0004-kds-sse-self-close-and-reconnect-backoff.md`
- Known issue: `docs/known-issues/0002` (Symptom C)

---

## #5 · Make Prisma the type source; Zod at the seam — ◑ AUDITED (deferred)

Rating: Speculative.

Replace the hand-written domain types in `lib/types.ts` with Prisma-generated
types, and validate data crossing the Store seam (and API boundaries) with Zod
DTOs. Removes the dual maintenance of `lib/types.ts` vs. `prisma/schema.prisma`.

**Audit 2026-06-22** — drift is real but latent (enums duplicated but in sync;
entity omissions like `kitchenOpen` / `updatedAt` are intentional domain shaping;
no production bugs). **Implementation deferred** until a PRD trigger fires.
ADR-0003. Issue 01 queued (enums + Zod on `CreateOrderInput`).

- Audit: `.scratch/prisma-type-source/AUDIT.md`
- PRD: `.scratch/prisma-type-source/PRD.md`
- Issues: `01-enum-source-zod-create-order` (blocked on trigger)
- ADR: `docs/adr/0003-prisma-type-source-audit.md`

---

## #6 · KDS Vendor Suite — ✅ DONE (Issue 05 shipped)

Rating: Strong · Scope: ports & adapters + vendor UI.

Five vendor-facing capabilities on the ElevenLabs editorial design system:
menu CRUD (soft-delete), Vercel Blob media gallery, order History filters,
CSV/XLSX + print receipt export, and data-derived onboarding guides. Foundation
first: Issue 0 wires `DESIGN.md` → Tailwind + primitive kit before features.

**Grilled 2026-06-23** — decisions in
`.scratch/kds-vendor-suite/grill-decisions.md`. **PRD written 2026-06-23**.
**Issues sliced 2026-06-23** — six vertically isolated cards (00–05) under
`.scratch/kds-vendor-suite/issues/`.

**Issue 00 shipped 2026-06-23** — `DESIGN.md` tokens in `tailwind.config.ts`
(canvas/ink/hairline/gradient/surface/semantic + type scale + spacing/radius);
Inter (`--font-body`) + Instrument Serif (`--font-display`) in `app/layout.tsx`;
primitive kit at `components/ui/primitives/` (Button, Input, Card, Modal, Badge,
GradientOrbs); four-tab KDS nav shell with History/Setup placeholders using
primitives; legacy `zt-*`/`zk-*` marked deprecated. `npm run build` + 88/88 tests
green.

**Issue 01 shipped 2026-06-23** — `archivedAt` migration + Store CRUD
(create/update/archive/restore/renameCategory, getArchivedMenu/getMenuItem);
guarded `lib/actions/vendor-menu.ts` + `VENDOR_WRITE_SECRET` / `useWriteSecret`;
Menu tab (`MenuSection`, `MenuItemModal`) replaces `InventoryGrid` with
primitive-kit UI (create/edit, archive/restore, category typeahead, availability
toggle unchanged). 102/102 tests green; `npm run build` passes. ADR-0006,
ADR-0009.

**Issue 02 shipped 2026-06-23** — `MenuImage` migration + data backfill from
`imageUrl`; Store image verbs (`addMenuImage`, `uploadMenuImageBlob`,
`reorderMenuImages`, `setPrimaryMenuImage`, `removeMenuImage`) on both adapters;
guarded upload/URL/reorder/primary/remove actions; `MenuImageGallery` in edit
modal; `getPrimaryImageUrl` on KDS Menu cards + storefront `MenuItemCard`;
`@vercel/blob` + `BLOB_READ_WRITE_TOKEN`. In-memory contract 32/32 green;
`npm run build` passes. ADR-0007, ADR-0008.

**Issue 04 shipped 2026-06-23** — printable branded receipt at
`/vendor/[slug]/receipt/[orderId]` (`PrintReceiptButton`, `@media print` CSS);
guarded `GET /api/vendor/[slug]/export` (CSV + XLSX via `exceljs`, reuses
`listOrdersFiltered` for all matching rows, `EXPORT_MAX_ROWS = 10_000`);
`lib/vendor/export-orders.ts` + 9 unit tests; History export buttons + per-row
Receipt link; `getPaymentForOrder` on Store for MoMo ref. `npm run build`
passes. ADR-0011.

**Issue 05 shipped 2026-06-23** — `SetupDrawer` with data-derived checklist
(`lib/vendor/onboarding.ts`, `loadOnboardingState` action); dismissible
`Coachmark` tooltips (`zantap:kds-coachmark-*` localStorage); persistent `?` FAB;
write-secret row in drawer; coachmark targets on kitchen toggle, Menu "+", dispatch
button. 5 onboarding unit tests; `npm run build` passes. ADR-0012. **Candidate #6
batch complete.**

**Prod smoke complete 2026-06-24** — human walkthrough on `zantap-psi.vercel.app`
(all steps 0–7 PASS). Latest deploy alias: `zantap-psi.vercel.app`.
- ✅ `VENDOR_WRITE_SECRET` + `BLOB_READ_WRITE_TOKEN` in Vercel Production (Sensitive).
- ✅ Export API `403` without secret → `200` with header (browser CSV confirmed).
- ✅ KDS shell, Setup checklist (4/5 — dispatch pending), coachmarks, menu CRUD + Blob image,
  History filters + CSV + receipt `200`, live PAID order on SSE, hard refresh `200` (known-issue 0001).
- ✅ **Receipt Back polish deployed 2026-06-24** (`8b34a2f` → `zantap-psi.vercel.app`):
  same-tab receipt links from History, `ReceiptBackButton` on receipt page,
  `?tab=history` deep link restores History tab. Prod curl smoke: KDS `?tab=history`
  `200` (History active), receipt `200` (Back button present), no `target="_blank"`.

- PRD: `.scratch/kds-vendor-suite/PRD.md`
- Grill: `.scratch/kds-vendor-suite/grill-decisions.md`
- Issues: `00-design-system-foundation` ✅ → `01-menu-crud-store-and-ui` ✅ → `02-menu-media-gallery` ✅ → `03-order-history-filters` ✅ → `04-order-export` ✅ → `05-vendor-onboarding-guides` ✅
- ADRs: `docs/adr/0006-menu-soft-delete-archived-at.md`, `docs/adr/0007-vercel-blob-menu-media.md`, `docs/adr/0008-menu-image-gallery-model.md`, `docs/adr/0009-deferred-auth-write-secret.md`, `docs/adr/0010-order-history-filter-semantics.md`, `docs/adr/0011-order-export-guard-and-row-cap.md`, `docs/adr/0012-onboarding-data-derived-checklist.md`
- Depends on: #1 Store seam ✅, #2 Payment ✅, ADR-0005 design system ✅

---

## #7 · KDS workflow optimization — ✅ DONE (prod smoke complete)

Rating: Strong · Scope: Store seam + KDS Orders tab UI (no visual redesign).

Kitchen operations upgrade: orthogonal `kitchenStage` + `paidAt`, human-readable
aging/urgency, workflow-first queue sort, bulk forward stage updates, expanded
ticket data, polished empty/degraded states. Preserves dark KDS aesthetic and SSE
live push.

**Grilled 2026-06-24** — decisions in
`.scratch/kds-workflow-optimization/grill-decisions.md`, ADR-0013.
**PRD + issues sliced 2026-06-24** — `.scratch/kds-workflow-optimization/`.
**Issue 01 shipped 2026-06-24** — schema/migration/backfill + Store adapters +
contract tests (`lib/kds/kitchen-stage.ts`, migration `20260624120000_order_kitchen_stage`).
**Issue 02 shipped 2026-06-24** — `advanceKitchenStage` / `bulkAdvanceKitchenStage`
in `lib/actions/vendor.ts`; `KitchenStageTransitionError`; ADR-0014; build green.
**Issue 03 shipped 2026-06-24** — KDS workflow UI: `formatRelativeTime` + urgency
tiers, `sortKdsQueueOrders`, kitchen stage badges, stage chips, bulk bar,
empty/degraded states, dispatch wired to `advanceKitchenStage(…, OUT_FOR_DELIVERY)`;
`npm run build` green.
**Prod smoke complete 2026-06-24** — automated walkthrough on `zantap-psi.vercel.app`
(`88fc62e` → `dpl_2xXFXgkvEfcT7umtg8YicR2NtHNp`):
- ✅ Deploy + migration already applied; KDS/SSE `200`, `kitchenStage` in stream payload.
- ✅ NEW badge dominant + PAID secondary; relative time (`Yesterday`, `2 days ago`, `3 hrs ago`).
- ✅ Stage chips: #0485 NEW → ACCEPTED → PREPARING → READY.
- ✅ Dispatch modal (Copy + WhatsApp share) → OUT FOR DELIVERY (SSE `DISPATCHED`).
- ✅ Mark completed → COMPLETED badge on #0485.
- ✅ Bulk select #0779 + #7636 → Mark Preparing (both PREPARING).
- ✅ Customer order placed (Smash Burger, MoMo PIN 12345) appeared as #5042 on KDS.

- PRD: `.scratch/kds-workflow-optimization/PRD.md`
- Grill: `.scratch/kds-workflow-optimization/grill-decisions.md`
- Issues: `01-schema-and-store` ✅ → `02-server-actions` ✅ → `03-kds-ui` ✅
- ADRs: `docs/adr/0013-kds-kitchen-stage-orthogonal-to-order-status.md`, `docs/adr/0014-kitchen-stage-server-actions.md`
- Depends on: #1 Store ✅, #2 Payment ✅, #4 KDS SSE ✅

---

## Post-backlog (2026-06-24)

| Slice | Status | Tracker |
|-------|--------|---------|
| KDS Orders tab → DESIGN.md | ✅ Done · committed `199048e` · deployed `dpl_G4kS89FBo71KhZLn43hvuSGZD4Wg` → `zantap-psi.vercel.app` 2026-06-24 | `.scratch/kds-orders-design-migration/issue-01-orders-tab-tokens.md` |
| Delivery slip page → DESIGN.md | ✅ Done · committed `b08a3ca` · deployed `dpl_2p7RSEAgq5WbQevuuaJokFpL6uDL` → `zantap-psi.vercel.app` 2026-06-24 | `.scratch/kds-orders-design-migration/issue-02-delivery-slip-tokens.md` |
| Remove dead `zk-*` Tailwind palette | ✅ Done · committed `4553388` · deployed `dpl_8Q52wTnGTXU57RB7yiEDLc9jX3BU` → `zantap-psi.vercel.app` 2026-06-24 | ADR-0016 consequences |
| Customer storefront redesign | ⏸ deferred | Owner: new designs later — do not migrate `zt-*` yet |
| `/to-prd` post-backlog probe | ✅ Done 2026-06-24 | Candidate #8 PRD + issue; #9–#13 probe table below |
| KDS dark operational theme restore | ✅ Done · committed `4440d2d` · deployed `dpl_6VfQnfy66KGdoJxYNbourWgvJBoD` → `zantap-psi.vercel.app` · prod-smoked 2026-06-27 | `.scratch/kds-dark-identity-restore/grill-decisions.md`, ADR-0017 |

---

## #8 · Storefront menu image carousel — ✅ DONE

Rating: Strong · Scope: customer UI only (no Store/schema).

Swipeable multi-image thumb on `MenuItemCard` when `images.length >= 2`.
Follow-up from vendor-suite Issue 02 / ADR-0008. **Keeps `zt-*` blush-glass** —
not the DESIGN.md customer migration.

- PRD: `.scratch/storefront-image-carousel/PRD.md`
- Issues: `01-menu-card-carousel` ✅
- ADR: `docs/adr/0018-storefront-menu-image-carousel.md`
- Depends on: MenuImage gallery ✅, Store hydrates `images` ✅
- Shipped 2026-06-27: `b243c81` → `dpl_fKu6ie9FfMy552GTYBCwkAYuJy7c` → `zantap-psi.vercel.app`. `getMenuItemGalleryUrls`, `MenuItemImageCarousel` (scroll-snap + dots), `MenuItemCard` wire-up, 5 unit tests; build green; prod curl PASS (bundle has carousel; prod DB has 0 multi-image items — swipe needs KDS upload).

---

## #14 · Storefront item customization modal (visual-only) — ✅ DONE · DEPLOYED · prod curl PASS

Rating: Owner request · Scope: customer UI only (no Store/schema/order pipeline).

Tap a `MenuItemCard` body → premium glassmorphic bottom sheet (hero carousel +
included/add-on customization + notes + live summary + sticky "Add to Order").
`+` stays pure quick-add. **Visual-only**: modifiers/notes are display-only and do
NOT reach cart/Order/KDS/receipt this slice — a future "real modifiers" epic
(separate `/grill-with-docs`) makes them persisted + server-priced. Keeps `zt-*`
blush-glass (not DESIGN.md migration). Optional `MenuItem.customization?` field is
the forward-compatible seam.

**Grilled 2026-06-27** (six decisions). PRD + issue written. **Issue 01 implemented
2026-06-27** — `npm test` 187/187 + `npm run build` green; storefront dev curl HTTP 200.
**Shipped 2026-06-28** — committed `9479cd7` (`feat(storefront): item customization
modal (visual-only)`), pushed to `main`, deployed to prod
`dpl_DRzpEfNQD8RpkkX3RoM7JEtZJR1k` → `zantap-psi.vercel.app`. **Mockup layout
refactor 2026-06-28** — committed `d328c8a` (square header image + Photos thumb
strip + notes retained), deployed `dpl_DJMPCwAAE8ecdwFYbCdkdva93uvS` →
`zantap-psi.vercel.app`. **Stepper polish 2026-06-28** — committed `764e916`
(compact qty pill repositioned right via `ml-auto`, top handle spacing), deployed
`dpl_2gR9gDbnH1oic5qzz5qqjTYzrPDx` → `zantap-psi.vercel.app`. Prod curl PASS.

What shipped (Issue 01):
- `lib/menu/customization.ts` (server-safe — no `"use client"`/React/DOM): persistence-
  shaped `IngredientOption` / `AddOnOption` / `ItemCustomization` /
  `CustomizationSelection` (stable string ids + integer RWF prices, `icon` = Icon-name
  string), `resolveCustomization` (item field or generic fallback), `emptySelection`,
  pure `computeCustomizeTotal((base + Σ addOn.priceRwf×qty) × qty)`, `CUSTOMIZATION_NOTES_MAX`.
- `lib/types.ts`: optional `MenuItem.customization?: ItemCustomization` (type-only import;
  no runtime cycle).
- `lib/menu/__tests__/customization.test.ts`: 10 tests (resolve/fallback, emptySelection,
  total with add-ons/qty/removals/unknown-id/fallback pricing).
- `MenuItemImageCarousel.tsx`: generalized to a size-agnostic core (`variant` thumb 72×72 /
  header 88×88 / hero full-width; slides `h-full w-full`); `indicator` `dots`|`count`;
  scroll-snap + `ResizeObserver` preserved; 0/1/≥2 handled.
- `MenuItemCustomizeSheet.tsx` (`"use client"`): glassmorphic bottom sheet (fixed inset-0
  z-[60], blur scrim, translate-y, tap-scrim/X close), header (name/desc/base price/`− qty +`
  from 1), hero carousel (count badge), Included remove-toggles, Add-on toggles updating live
  total, capped notes textarea, live summary card, sticky `Add to order • <total>`; native
  Pointer-Event drag-to-dismiss (threshold/flick → close, else CSS spring-back). Emits ONE
  `CustomizationSelection` to `onAddToOrder`.
- `MenuItemCard.tsx`: card-body tap → `onOpen(item)` (role/tabindex/Enter-Space a11y); `+`
  keeps quick-add via `e.stopPropagation()`. `GlassPanel` now forwards `HTMLAttributes`.
- `Storefront.tsx`: `activeItemId` state; one `MenuItemCustomizeSheet`; single
  `handleAddToOrder(selection)` adapter (`for … addItem(menuItemId)` then close) — the only
  cart chokepoint. Storefront stays mounted/dimmed behind the scrim.

Known gap (per ADR-0019): add-ons/removals/notes are display-only — they do NOT reach
the cart/Order/KDS/receipt. Checkout total = base prices × qty. Closed by a future
"real modifiers" epic (separate `/grill-with-docs`).

Deviation from mockup: header thumbnail + separate "Photos" strip consolidated into the
single full-width hero carousel the spec mandates (count badge) — avoids two redundant
carousels of the same images. Trivially splittable if the owner wants the exact layout.

- PRD: `.scratch/storefront-customization-modal/PRD.md`
- Issues: `01-customization-modal` ✅ (ready-for-human — needs device gesture smoke + commit/deploy)
- ADR: `docs/adr/0019-storefront-item-customization-modal.md`
- Depends on: #8 carousel ✅ (`getMenuItemGalleryUrls`, `MenuItemImageCarousel`),
  `CartContext.addItem` ✅

---

## Post-backlog probe notes (#9–#13) — 2026-06-24

| # | Candidate | Readiness | Gate / notes |
|---|-----------|-----------|--------------|
| 9 | Vendor WhatsApp PAID notification | Code stub exists | `buildVendorOrderNotification` in `lib/whatsapp.ts` is **unused**; `Vendor.phoneNumber` in schema. MVP = `wa.me` deep-link (who opens it — customer success vs KDS — needs owner UX pick). Not sliced. |
| 10 | Customer storefront → DESIGN.md | Blocked | ~60+ `zt-*` refs across 9 customer components; `zt` palette still in `tailwind.config.ts`. **Do not start without owner designs.** |
| 11 | Live MTN MoMo | High risk | Simulated STK in `lib/momo/simulate.ts` + `/api/momo/stk`. Payment module (#2) ✅. **Requires `/grill-with-docs` before PRD.** |
| 12 | Vendor authentication | Deferred per AGENTS.md | Write-secret interim (ADR-0009). Real auth = separate grill + PRD. |
| 13 | Ops / security | Mixed | `README.md` stale (still references `lib/data/*`, Phase 2 deferrals). Write-secret rotation playbook. Export/upload already guarded; rate limits not audited. |
| 5 | Prisma/Zod type source | Audited | Triggers in ADR-0003 still not fired — **do not lift defer without owner OK.** |

---

- The candidates are a prioritized backlog from one review, **not** a gate. New
  features/fixes can be interleaved freely.
- Only hard recommendation: don't ship new **payment-touching** features before
  #2 (live money-correctness bug in production today).
- #1 (the foundation everything else assumed) is done, so new work is safe as
  long as it goes **through the Store seam** (no competing data paths; no ad-hoc
  Supabase SDK wiring — see `AGENTS.md`).
