# Architecture candidates — backlog index

Source: `/improve-codebase-architecture` review (recovered from session transcript
`5e22d701-4923-4f9b-80ba-5c1a99150bea`, which rendered the five candidates as an
HTML report). This file is the durable, session-independent record so the backlog
is never lost again.

> Note: `.scratch/` is local and gitignored (per `AGENTS.md` issue-tracker
> convention — local markdown, no GitHub round-trips). It persists on this machine
> across sessions, but does **not** sync via git to other clones/machines.

Last verified against the codebase: 2026-06-22.

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

There are exactly **5** candidates. No hidden #6+.

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

- PRD: `.scratch/kds-live-push/PRD.md`
- Issues: `01-sse-stream-replace-polling`
- ADR: `docs/adr/0002-kds-live-push-sse.md`

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

## Notes on ordering (not a mandatory sequence)

- The candidates are a prioritized backlog from one review, **not** a gate. New
  features/fixes can be interleaved freely.
- Only hard recommendation: don't ship new **payment-touching** features before
  #2 (live money-correctness bug in production today).
- #1 (the foundation everything else assumed) is done, so new work is safe as
  long as it goes **through the Store seam** (no competing data paths; no ad-hoc
  Supabase SDK wiring — see `AGENTS.md`).
