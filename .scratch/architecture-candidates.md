# Architecture candidates — backlog index

Source: `/improve-codebase-architecture` review (recovered from session transcript
`5e22d701-4923-4f9b-80ba-5c1a99150bea`, which rendered the five candidates as an
HTML report). This file is the durable, session-independent record so the backlog
is never lost again.

> Note: `.scratch/` is local and gitignored (per `AGENTS.md` issue-tracker
> convention — local markdown, no GitHub round-trips). It persists on this machine
> across sessions, but does **not** sync via git to other clones/machines.

Last verified against the codebase: 2026-06-23.

## Open production issues (read before touching the KDS)

- **Known issue 0001** — KDS `/vendor/<slug>` shows the browser's "This page couldn't
  load" on reload, and `/vendor/<slug>/kds-stream` shows "Vendor not found".
  Diagnosed 2026-06-23: the second is just a wrong URL (the stream is under `/api/...`,
  404 → `not-found.tsx`); the first is a real client/browser-side failure most likely
  from candidate #4's long-lived 1s-poll SSE on Vercel+HTTP/2. Server render is proven
  healthy. Full diagnosis, confirm-steps, and fix options:
  `docs/known-issues/0001-kds-page-couldnt-load-and-stream-url.md` (git-tracked).

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
| 6 | KDS Vendor Suite (menu, media, export, history, guides) | Strong | ports & adapters | ✅ Done — uncommitted on main | `.scratch/kds-vendor-suite/PRD.md` |

There are exactly **6** candidates.

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

- PRD: `.scratch/kds-vendor-suite/PRD.md`
- Grill: `.scratch/kds-vendor-suite/grill-decisions.md`
- Issues: `00-design-system-foundation` ✅ → `01-menu-crud-store-and-ui` ✅ → `02-menu-media-gallery` ✅ → `03-order-history-filters` ✅ → `04-order-export` ✅ → `05-vendor-onboarding-guides` ✅
- ADRs: `docs/adr/0006-menu-soft-delete-archived-at.md`, `docs/adr/0007-vercel-blob-menu-media.md`, `docs/adr/0008-menu-image-gallery-model.md`, `docs/adr/0009-deferred-auth-write-secret.md`, `docs/adr/0010-order-history-filter-semantics.md`, `docs/adr/0011-order-export-guard-and-row-cap.md`, `docs/adr/0012-onboarding-data-derived-checklist.md`
- Depends on: #1 Store seam ✅, #2 Payment ✅, ADR-0005 design system ✅

---

## Notes on ordering (not a mandatory sequence)

- The candidates are a prioritized backlog from one review, **not** a gate. New
  features/fixes can be interleaved freely.
- Only hard recommendation: don't ship new **payment-touching** features before
  #2 (live money-correctness bug in production today).
- #1 (the foundation everything else assumed) is done, so new work is safe as
  long as it goes **through the Store seam** (no competing data paths; no ad-hoc
  Supabase SDK wiring — see `AGENTS.md`).
