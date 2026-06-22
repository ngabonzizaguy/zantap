# ADR-0002: KDS live updates via Server-Sent Events

Date: 2026-06-22  
Status: Accepted

## Context

Candidate #1 closed the KDS split-brain: `KdsDashboard` already reads through
`loadKdsSnapshot` → Store. The remaining gap was transport — the client polled
every 5 seconds via `setInterval`, so new paid orders could sit invisible for up
to 5s and every tab issued its own poll loop.

Candidate #4 scope is **ports & adapters for transport only** — no competing
data path, no Supabase Realtime SDK, no browser-side Store.

## Decision

Replace client polling with **SSE** (`EventSource`) on
`GET /api/vendor/[slug]/kds-stream`.

- **Server reads through the existing Store seam** via `fetchKdsSnapshot`
  (`lib/kds/snapshot.ts`), shared with the `loadKdsSnapshot` server action.
- The stream loop polls the Store every **1s** server-side and pushes a JSON
  snapshot only when `fingerprintKdsSnapshot` detects a change (orders, menu
  availability, today gross, kitchen flag).
- **15s heartbeat** comments keep intermediaries from closing idle connections.
- **WebSocket rejected** for now: SSE is unidirectional (server → KDS), works
  through standard HTTP proxies, and needs no extra client library. Upgrade path
  exists if we later need vendor → server commands over the same socket.
- **Post-mutation `refresh()` kept** on vendor actions (toggle kitchen, dispatch,
  etc.) so the UI updates immediately without waiting for the next server tick.

## Consequences

- KDS latency drops from up-to-5s client poll to up-to-1s server push (plus
  immediate refresh after local vendor actions).
- Each open KDS tab holds one long-lived route handler; acceptable for a
  single-vendor demo, but watch Vercel function duration limits at scale.
- Cross-instance “instant” push still depends on the 1s server poll until we add
  DB NOTIFY or an external pub/sub — correctness remains Store-backed.
- `lib/kds/` is the home for KDS transport helpers; snapshot types are shared
  client/server via `lib/kds/types.ts` (no `server-only` import).

## Alternatives considered

| Option | Why not (for this slice) |
|--------|--------------------------|
| Client keeps polling | Doesn't meet the candidate goal; wastes requests per tab |
| WebSocket | Bidirectional overhead we don't need yet |
| Supabase Realtime | Competing data path; deferred per `AGENTS.md` |
| In-process EventEmitter on Store | Doesn't work across serverless instances |
