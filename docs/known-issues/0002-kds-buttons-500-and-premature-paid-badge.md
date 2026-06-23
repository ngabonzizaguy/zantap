# Known issue 0002 — KDS action buttons 500 in prod + orders show "PAID via MoMo" before payment

Status: **Fixed, deployed & verified in prod 2026-06-23** · Reported: 2026-06-23 (production, `zantap-psi.vercel.app`)
Related: candidate #4 (KDS live push / SSE). See `.scratch/architecture-candidates.md` and `docs/known-issues/0001`.

Two separate symptoms reported together; both fixed. A third (SSE timeout) surfaced by the
logs is now also fixed (2026-06-23) — see Symptom C below.

---

## Symptom A — KDS buttons unresponsive + console error  → REAL (root-caused via prod logs)

The vendor KDS OPEN/CLOSED toggle, "Reset all", and item availability toggles did
nothing and the browser console showed `Uncaught (in promise) ... An error occurred
in the Server Components render` + `POST /vendor/<slug> 500`.

### CONFIRMED root cause (Vercel runtime logs, 2026-06-23)
```
POST /vendor/inka-steakhouse  500  ReferenceError: KdsSnapshot is not defined
```
`lib/actions/vendor.ts` (a `"use server"` module) had `export type { KdsSnapshot };`.
A `"use server"` file may export **only async server actions** — Next.js registers
every export as a server reference. In the **production** build that type re-export
leaks a runtime reference to a type (no value) → `ReferenceError` on module load →
**every** action in the file (`toggleItem`, `resetMenu`, `setKitchen`,
`advanceOrderStatus`, `loadKdsSnapshot`) 500s. Dev (Turbopack) tolerated it, so it
reproduced only in prod — which masked it during local testing and direct Store probes
(those bypass the action module).

### Fix applied (2026-06-23)
- Removed `export type { KdsSnapshot };` from `lib/actions/vendor.ts`; the type is
  imported from `@/lib/kds/types` where it is needed. Added a guard comment.
- Verified with a clean `next build` (production compile of the action module).
- Defensive UX: `components/vendor/KdsDashboard.tsx` handlers are now optimistic with
  rollback, so a failed action updates instantly and can never surface as an uncaught
  promise rejection.

### Note / dead-end
An initial hypothesis blamed Prisma + Supabase pooler (`pgbouncer=true`). The runtime
log disproved it (the error was a JS `ReferenceError`, not a DB error). The speculative
`lib/prisma.ts` / `lib/store/index.ts` connection changes were **reverted**.

## Symptom B — orders show "PAID via MoMo" before the customer enters their PIN  → REAL

The KDS rendered **every** order, including `PENDING` ones (an order is created the
moment the customer taps "Pay", before the MoMo PIN), and `OrderTicket` hardcoded the
"PAID via MoMo" badge regardless of `order.status`.

### Fix applied (2026-06-23)
- `lib/kds/snapshot.ts` — `fetchKdsSnapshot` filters to `PAID` / `DISPATCHED` /
  `COMPLETED`. A pre-PIN `PENDING` order never reaches the kitchen.
- `app/vendor/[slug]/page.tsx` — initial server render reads through the same
  `fetchKdsSnapshot` so first paint and the live SSE stream agree.
- `components/vendor/OrderTicket.tsx` — the "PAID via MoMo" badge is gated on paid
  status, so an unpaid ticket can never display it even if one slips through.
- Verified end-to-end (in-memory store): placed order is `PENDING` and hidden; after
  `confirmPayment` it is `PAID` and visible.

## Symptom C — SSE stream times out every ~5 min on Vercel  → FIXED 2026-06-23
```
GET /api/vendor/<slug>/kds-stream  Vercel Runtime Timeout Error: Task timed out  (~every 300s)
```
The long-lived SSE route (`app/api/vendor/[slug]/kds-stream/route.ts`) polled every 1s
forever; Vercel **killed** the function at its max duration (~300s). Abnormal termination
is what logged the error; the browser EventSource reconnected, so updates self-healed with
a brief gap, but each cycle logged a "Task timed out" — the error flood in the screenshots.

### Fix applied (2026-06-23) — chose self-close + client backoff (option a + the client half of b)
The function was being *killed* rather than *finishing*. The fix makes it finish:
- `app/api/vendor/[slug]/kds-stream/route.ts` — the stream now self-closes via a
  `MAX_STREAM_MS = 250_000` lifetime timer (one idempotent `teardown()` shared by the
  initial-read error, poll error, request abort, and planned close). A clean
  `controller.close()` lets the function **return normally** ~50s before Vercel's kill, so
  no "Task timed out" is ever logged. `export const maxDuration = 300` pins the window so
  the 250s margin doesn't ride on the plan default.
- `lib/kds/useKdsLiveSnapshot.ts` — the client now owns reconnection with exponential
  backoff (`RECONNECT_BASE_MS = 1_000` → `RECONNECT_MAX_MS = 15_000`, reset on `onopen`).
  On `onerror` it closes the source (stops the native retry) and reconnects itself: the
  planned ~250s close reconnects in ~1s (seamless), while a genuine outage backs off
  instead of tight-looping. Hook signature unchanged.

Stays fully behind the Store seam — pure transport change, `fetchKdsSnapshot` untouched.

### Verified (2026-06-23) — deployed & confirmed in prod
- `npm run build` green (prod compile of the route + client hook; dev-green ≠ prod-green).
- Deployed to prod 2026-06-23 (`dpl_CcKFimVQaQg87wc9rQmhSdkF48S1`, alias `zantap-psi.vercel.app`).
- **Self-close confirmed in prod:** held SSE connections via curl self-closed cleanly at
  ~252–257s (curl exit 0 = server `controller.close()`, not a kill) across two back-to-back
  reconnect cycles (~8.5 min total), exactly the `MAX_STREAM_MS=250_000` design.
- **No timeout flood:** `vercel logs zantap-psi.vercel.app --json` over the whole window shows
  every `/api/vendor/inka-steakhouse/kds-stream` request as `level:"info"` /
  `responseStatusCode:200` — zero "Task timed out", zero errors/500s.
- **Status-gating intact:** prod SSE initial frame is all `PAID` (no `PENDING`); 15s heartbeats present.
- **Two-tab smoke passed:** customer paid via MoMo (PIN sim) → order **#4513** (9,500 RWF) appeared
  on the KDS badged "PAID via MoMo"; snapshot PAID count went 8 → 9, `PENDING=0`.
- Note: the MCP `get_runtime_logs` could not be used (the Vercel MCP token is scoped to a
  different project — `digsol`, not `zantap` — returning 403); the authenticated `vercel logs`
  CLI was used instead. See AGENTS.md "Tooling notes".

Ties into candidate #4 / known-issue 0001.

### Key files
- `lib/actions/vendor.ts` — server actions (was throwing on load; fixed).
- `lib/kds/snapshot.ts` — KDS read seam (now filters to paid orders).
- `app/vendor/[slug]/page.tsx` — KDS initial render.
- `components/vendor/OrderTicket.tsx` — ticket badge.
- `components/vendor/KdsDashboard.tsx` — optimistic action handlers.
- `app/api/vendor/[slug]/kds-stream/route.ts` — SSE route (Symptom C, follow-up).
