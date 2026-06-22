# SSE stream replaces KDS client polling

Status: done

## Parent

PRD: `.scratch/kds-live-push/PRD.md`

## What was built

- `lib/kds/types.ts` — shared `KdsSnapshot` type (client + server)
- `lib/kds/snapshot.ts` — `fetchKdsSnapshot` (server-only, Store seam)
- `lib/kds/fingerprint.ts` — change detector for SSE frames
- `lib/kds/useKdsLiveSnapshot.ts` — client `EventSource` hook
- `app/api/vendor/[slug]/kds-stream/route.ts` — SSE endpoint (1s poll, 15s heartbeat)
- `KdsDashboard.tsx` — subscribe via hook; keep `refresh()` after vendor actions
- `lib/actions/vendor.ts` — delegates to `fetchKdsSnapshot`
- `lib/kds/__tests__/fingerprint.test.ts` — 4 unit tests

## Acceptance criteria

- [x] Client 5s `setInterval` removed from `KdsDashboard`
- [x] SSE route reads through Store (`fetchKdsSnapshot`)
- [x] No new competing data path (no Supabase SDK, no browser Store)
- [x] Matte dark KDS UI unchanged
- [x] `npm test` green (88/88)
- [x] ADR: `docs/adr/0002-kds-live-push-sse.md`

## Manual smoke (recommended)

1. Open KDS: `/vendor/inka-steakhouse`
2. In another tab, complete customer checkout (menu → cart → MoMo → success)
3. Confirm new PAID order appears on KDS within ~1s without manual refresh

## Blocked by

- None (candidate #1 Store seam required — done)
