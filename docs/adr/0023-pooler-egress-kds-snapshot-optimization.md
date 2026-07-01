# ADR-0023: Reduce Supabase pooler egress from KDS live stream

Date: 2026-07-01  
Status: Accepted

## Context

Supabase Free plan egress spiked (~1.1 GB/day, 100% Shared Pooler Egress). The
app has no Supabase JS client — all production reads go through Prisma on
`DATABASE_URL` (Supavisor port 6543).

Phase 1 audit identified the KDS SSE route as the primary sustained load:
`GET /api/vendor/[slug]/kds-stream` polled `fetchKdsSnapshot()` every **1s**
per open tab, loading **all vendor orders** (with nested menu items + images)
plus the **full menu** on every tick — even when nothing changed (fingerprint
only skipped the SSE push, not the DB read).

Order history on the KDS is already paginated via `HistoryPanel` →
`listOrdersFiltered`; the live queue does not need unbounded history.

## Decision

1. **Revision-first SSE polling** — the stream calls
   `getKdsSnapshotRevision()` (minimal selects + aggregate) every 1s; the full
   `fetchKdsSnapshot()` runs only when the revision string changes.

2. **Scoped KDS order reads** — new Store methods `listKdsOrders` and
   `getKdsSnapshotRevision`:
   - Include `PAID` and `DISPATCHED` always.
   - Include `COMPLETED` only when `updatedAt >= start of today` (Africa/Kigali,
     same calendar semantics as order history).
   - KDS order includes use a **narrow** menu-item select (name/price/imageUrl,
     no `MenuImage` gallery rows).

3. **Aligned fingerprint** — `fingerprintKdsSnapshot` and revision keys share
   `buildKdsSnapshotRevision`, including `kitchenStage` (fixes missed pushes on
   stage-only updates).

4. **Seed guard** — `prisma/seed.ts` refuses remote Supabase `DATABASE_URL`
   unless `SEED_ALLOW_REMOTE=1`, preventing accidental prod wipes via the pooler.

`loadOnboardingState` still uses `listOrders` (user-triggered, not polled).

## Consequences

- Idle KDS tabs: ~4 small queries/sec instead of 2 heavy graph loads/sec.
- Full snapshot fetches scale with **changes**, not wall-clock time.
- KDS queue payload no longer grows with months of completed orders.
- `#prisma` contract tests remain opt-in on `TEST_DATABASE_URL` (direct 5432);
  document unchanged in `.env.example`.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Supabase Realtime | Competing data path; deferred per `AGENTS.md` |
| Longer poll interval only | Helps but idle tabs still load full history each tick |
| DB NOTIFY / LISTEN | Correct long-term; more infra than this hotfix |
| Cache snapshot in memory | Breaks across serverless instances |

Supersedes the implicit “poll full snapshot every 1s” consequence in ADR-0002 /
ADR-0004 for read volume only; transport (SSE, self-close, reconnect) unchanged.
