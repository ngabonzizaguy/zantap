# ADR-0030: KDS dashboard Live/Off + Kigali-bounded gross delta

**Status:** Accepted  
**Date:** 2026-07-02  
**Candidate:** #19 Issue 02 (grill decisions A1, A2)

## Context

`MetricsBanner` showed a static green "· Live" label regardless of kitchen state, and
a hardcoded `+12.5%` gross trend with a decorative sparkline. `getTodayGross` used
server-local `setHours(0,0,0,0)`, which is wrong on Vercel (UTC) for Rwanda vendors.

## Decision

1. **A1 — Live/Off:** Wire the header status word to `kitchenOpen` (green "Live" /
   red "Off"). Keep the existing OPEN/CLOSED toggle pill unchanged.
2. **A2 — Real delta:** Add `getYesterdayGross` mirroring `getTodayGross` with the
   same `COUNTED_STATUSES` (`PAID`, `DISPATCHED`, `COMPLETED`). Both verbs bound
   `createdAt` via `resolveDateRange` / `startOfDayInTimezone` in **Africa/Kigali**.
3. Surface `yesterdayGross` on `KdsSnapshot` and include it in
   `buildKdsSnapshotRevision` so SSE revisions stay aligned.
4. **UI:** Replace the placeholder trend with `(today − yesterday) / yesterday` as a
   signed percentage (green/red). When `yesterdayGross === 0`, show **"New"** (not
   +100%). Remove the hardcoded sparkline.

## Consequences

- Dashboard gross figures match vendor-local calendar days on UTC-hosted infra.
- Contract tests cover yesterday gross isolation from today's orders.
- No schema change; read-only Store extension.
