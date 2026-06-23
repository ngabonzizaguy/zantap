# Known issue 0001 — KDS "This page couldn't load" on reload + "Vendor not found" on the stream URL

Status: **Fix applied 2026-06-23 (pending deploy/verify)** · First reported: 2026-06-23 (production, `zantap-psi.vercel.app`)
Related: candidate #4 (KDS live push / SSE). See `.scratch/architecture-candidates.md` §#4 and `docs/adr/0002-kds-live-push-sse.md`.

This documents two separate symptoms reported together. Only one is a real bug.

---

## Symptom A — `/vendor/<slug>/kds-stream` shows "Vendor not found"  → NOT A BUG

The user hit `https://zantap-psi.vercel.app/vendor/inka-steakhouse/kds-stream`.

- That path does not exist. The SSE endpoint is under **`/api`**:
  `app/api/vendor/[slug]/kds-stream/route.ts` → `/api/vendor/<slug>/kds-stream`.
- `/vendor/<slug>/kds-stream` (no `/api`) 404s and renders `app/not-found.tsx`, whose
  heading is the literal text **"Vendor not found"**. It is a generic 404 page, not a
  statement that the vendor record is missing.
- Verified: the correct endpoint streams fine — connection stays open >70s and pushes
  live snapshots from Postgres.

No code change needed. (Optional polish: reword `app/not-found.tsx` so a wrong path
doesn't read like a missing-vendor error.)

## Symptom B — `/vendor/<slug>` shows "This page couldn't load" on reload  → REAL

### What was verified (2026-06-23)
- Server render is healthy: 5/5 reloads returned HTTP 200 with a complete 33 KB HTML
  document (`</html>` present, no error text). DB/Prisma/render all work.
- The string "This page couldn't load" / "Reload to try again" exists **nowhere in the
  repo** (grep clean). It is the **browser's own** connection-failure page, not an app
  error page.
- There is **no `app/error.tsx` / `app/global-error.tsx`** — only `app/not-found.tsx`.
  So any client/runtime failure falls through to the raw browser error.

### CONFIRMED root cause (browser console, 2026-06-23)
DevTools showed `Uncaught TypeError: e.getTime is not a function` immediately before the
page crashed, followed by `EventSource failed loading` (a side effect of the crash, not
the cause). The earlier HTTP/2 theory was **wrong**. (The console also showed lots of
`ObjectMultiplex` / `MaxListenersExceededWarning` / `.well-known/vercel/jwe` noise — all
from a wallet browser extension; unrelated.)

Date-serialization bug in the SSE path:
- `Order.createdAt` is typed `Date` (`lib/types.ts`).
- First paint goes server→client via Next's RSC/Server-Action serialization, which
  **preserves `Date`** — so the page loads fine.
- The live path does not: `app/api/vendor/[slug]/kds-stream/route.ts` calls
  `JSON.stringify(snapshot)` (Date → ISO string), and the client `JSON.parse` in
  `lib/kds/useKdsLiveSnapshot.ts` leaves it a **string** (JSON has no Date type).
- ~1s after load, the first SSE frame replaces state with string `createdAt`;
  `OrderTicket.tsx:78` → `minutesAgo(order.createdAt)` → `format.ts:23` `date.getTime()`
  on a string → TypeError → React unmounts the tree → browser shows "This page couldn't
  load." Explains the reload-only symptom while the server stays healthy.

### Fix applied (2026-06-23)
`lib/kds/useKdsLiveSnapshot.ts` now revives date fields at the parse boundary
(`reviveSnapshot`: `orders[].createdAt = new Date(...)`) so the snapshot honors its
`Date` typing before reaching React. Single-file, no behavior change beyond correctness.

Remaining (optional, not required for this crash): add `app/error.tsx` so any future
client error degrades to a styled retry instead of the raw browser page; consider the
fingerprint test covering a date round-trip. SSE polling/HTTP2 items below were
speculative and are NOT the cause — keep only if separately desired.

### Key files
- `app/vendor/[slug]/page.tsx` — KDS page (server render; healthy).
- `components/vendor/KdsDashboard.tsx` — mounts `useKdsLiveSnapshot`.
- `lib/kds/useKdsLiveSnapshot.ts` — opens the `EventSource` (no reconnect/backoff).
- `app/api/vendor/[slug]/kds-stream/route.ts` — SSE route, 1s Postgres poll.
- `lib/kds/snapshot.ts` — `fetchKdsSnapshot` (4 queries per poll, via Store seam).
- `app/not-found.tsx` — the "Vendor not found" 404 page (Symptom A).
