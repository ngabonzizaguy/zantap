# ADR-0004: KDS SSE stream self-closes; client reconnects with backoff

Date: 2026-06-23
Status: Accepted
Supersedes part of: ADR-0002 (notes the Vercel function-duration caveat it called out)

## Context

ADR-0002 introduced KDS live updates over SSE: a long-lived route
(`app/api/vendor/[slug]/kds-stream/route.ts`) polls the Store every 1s and pushes a
snapshot when the fingerprint changes. ADR-0002 explicitly flagged the risk: "each open
KDS tab holds one long-lived route handler ... watch Vercel function duration limits."

That risk became known-issue 0002 Symptom C. In production the route ran until Vercel's
max duration (~300s) and was **killed**. The abnormal termination logged
`Vercel Runtime Timeout Error: Task timed out` every ~300s. The browser EventSource
auto-reconnected so live updates self-healed with a brief gap, but each cycle produced a
red error — the flood in the original screenshots. The client had **no** `onerror`
handling, so it relied on the native reconnect with no backoff against real outages.

## Decision

Make the function **finish** instead of being killed, and own reconnection on the client.

- **Server self-close.** A `MAX_STREAM_MS = 250_000` lifetime timer calls a single
  idempotent `teardown()` (shared by the initial-read error, poll error, request abort,
  and planned close) that clears the poll/heartbeat/lifetime timers and
  `controller.close()`s. The handler returns ~50s before the platform kill, so no timeout
  is ever logged.
- **Pin the window.** `export const maxDuration = 300` so the 250s margin is deterministic
  rather than depending on the plan default.
- **Client reconnect with backoff.** `lib/kds/useKdsLiveSnapshot.ts` now manages its own
  `EventSource` lifecycle: on `onerror` it closes the source (stopping the native retry)
  and schedules a reconnect with exponential backoff (`1s → 15s` ceiling, reset on
  `onopen`). The planned ~250s close reconnects in ~1s (seamless); a genuine outage backs
  off instead of tight-looping. The hook's public signature is unchanged.

Transport-only — `fetchKdsSnapshot` and the Store seam are untouched. No competing data
path (still honors ADR-0002 / AGENTS.md).

## Consequences

- The "Task timed out" error flood is eliminated; the function completes normally.
- Live latency is unchanged (still 1s server poll; `POLL_MS` untouched). Roughly every
  ~4 minutes the KDS reconnects with a ~1s gap, which is invisible in practice and far
  cheaper than the previous kill-and-error cycle.
- The client is now resilient to real network drops (previously undefined behavior).
- Each tab still holds one connection for up to 250s; for many concurrent vendors a true
  pub/sub (DB `NOTIFY` / external broker) remains the eventual upgrade — out of scope here.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Just raise `maxDuration` | Only moves the kill later; the timeout (and log) still happens, and it burns more function wall-time per connection. |
| Revert to client polling | Throws away ADR-0002; worse latency (up-to-5s) and every tab polls. |
| Rely on native EventSource retry only | No backoff — a dead backend gets hammered; no control over the reconnect gap. |
