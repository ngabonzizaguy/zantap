# Architecture candidates — backlog index

Source: `/improve-codebase-architecture` review (recovered from session transcript
`5e22d701-4923-4f9b-80ba-5c1a99150bea`, which rendered the five candidates as an
HTML report). This file is the durable, session-independent record so the backlog
is never lost again.

> Note: `.scratch/` is local and gitignored (per `AGENTS.md` issue-tracker
> convention — local markdown, no GitHub round-trips). It persists on this machine
> across sessions, but does **not** sync via git to other clones/machines.

Last verified against the codebase: 2026-06-22.

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
| 2 | Deepen payments into a Payment module | Strong | server | 📋 Queued | `.scratch/payment-module-idempotent-momo/PRD.md` |
| 3 | Extract a Checkout module from the Storefront UI | Worth exploring | in-process (client) | ⏳ Backlog | — |
| 4 | Give the KDS a real orders interface | Worth exploring | ports & adapters | ◑ Partially superseded by #1 | — |
| 5 | Make Prisma the type source; Zod at the seam | Speculative | — | ⏳ Backlog | — |

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

## #2 · Deepen payments into a Payment module — 📋 QUEUED

Persist `Payment` rows and make MoMo confirmation an idempotent state machine
behind the Store, killing the module-scoped `pendingTransactions` Map in
`lib/momo/simulate.ts` (the same realm/serverless split-brain #1 fixed, but for
money). PRD + 3 issues written. **Stops at the PRD; awaiting go-ahead to grill.**

- PRD: `.scratch/payment-module-idempotent-momo/PRD.md`
- Issues: `01-payment-in-store-idempotent-transition`,
  `02-payment-prisma-adapter`, `03-wire-momo-through-store-remove-map`
- Recommended before any new payment-touching feature (live correctness bug).

---

## #3 · Extract a Checkout module from the Storefront UI — ⏳ BACKLOG

Rating: Worth exploring · Scope: in-process (client-side refactor).

**Files:** `components/customer/Storefront.tsx`,
`components/customer/CartContext.tsx`,
`components/customer/CheckoutSheet.tsx` (`canProceedToPay`).

**Problem (verified 2026-06-22 — still accurate):** checkout logic is scattered
across three layers:
- `CheckoutSheet.tsx` defines `canProceedToPay(...)` — validation living in a
  presentation component, imported into `Storefront`.
- `CartContext.tsx` owns stage strings (`CheckoutStage`), cart totals
  (`getTotal`, `getLines`), and all checkout fields (phone/sector/landmark/pin/
  orderId/stkToken).
- `Storefront.tsx` (`handlePay` / `handleConfirmPin`) inline-orchestrates order
  creation (`placeOrder`), the `/api/momo/stk` calls, error handling, and every
  stage transition (`loading → ussd → success`, failure → `cart`).

**Proposed deepening:** consolidate into **one Checkout module** with a single
interface (validation + totals + stage machine + place-order/pay orchestration),
so the storefront UI renders against it instead of orchestrating inline.

**Sequencing note:** sits more cleanly **after #2** — the Checkout module's "pay"
step should call the new idempotent payment surface rather than today's inline
`fetch('/api/momo/stk')`.

---

## #4 · Give the KDS a real orders interface — ◑ PARTIALLY SUPERSEDED by #1

Rating: Worth exploring · Scope: ports & adapters.

**Files:** `components/vendor/KdsDashboard.tsx` (5s poll).

**Original problem:** the KDS polled its own browser `lib/data` store every 5s
and never saw server-side orders (split-brain gap).

**Verified 2026-06-22:** that gap is **already closed by #1**. `KdsDashboard`
still polls every 5s, but `refresh()` now calls the `loadKdsSnapshot` **server
action** (`lib/actions/vendor.ts`), reading the durable Store. The report's
"after — server is sole writer" state is already true.

**What actually remains:** the *transport* only — replace the 5s poll with live
push (SSE/WebSocket) so the KDS updates in real time. (This matches the #1 PRD
note: "KDS live push (SSE/WebSocket) — candidate #4 builds on this seam; polling
stays for now but reads through the server seam.") Lower urgency: correctness is
done; this is a UX/latency improvement.

---

## #5 · Make Prisma the type source; Zod at the seam — ⏳ BACKLOG

Rating: Speculative.

Replace the hand-written domain types in `lib/types.ts` with Prisma-generated
types, and validate data crossing the Store seam (and API boundaries) with Zod
DTOs. Removes the dual maintenance of `lib/types.ts` vs. `prisma/schema.prisma`.
Speculative — do only if type drift between the two becomes a real maintenance
cost.

---

## Notes on ordering (not a mandatory sequence)

- The candidates are a prioritized backlog from one review, **not** a gate. New
  features/fixes can be interleaved freely.
- Only hard recommendation: don't ship new **payment-touching** features before
  #2 (live money-correctness bug in production today).
- #1 (the foundation everything else assumed) is done, so new work is safe as
  long as it goes **through the Store seam** (no competing data paths; no ad-hoc
  Supabase SDK wiring — see `AGENTS.md`).
