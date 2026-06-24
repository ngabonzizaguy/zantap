# Issue 02 — Delivery slip page → DESIGN.md tokens

Status: **closed** (committed `b08a3ca` · local + prod smoke complete · deployed `dpl_2p7RSEAgq5WbQevuuaJokFpL6uDL` → `zantap-psi.vercel.app` 2026-06-24) · Labels: `ready-for-agent`

## Goal

Migrate `app/slip/[orderId]/page.tsx` — the last vendor-adjacent `zk-*` surface —
to `DESIGN.md` tokens, matching `DispatchModal` slip preview styling.

## Checklist

- [x] Page shell: `bg-canvas`, `font-body`, `text-ink`
- [x] Header: caption label, `font-display` order id, muted meta
- [x] Slip `<pre>`: `border-hairline`, `bg-canvas-soft`, mono `text-body-sm`
- [x] Footer copy on `text-muted`
- [x] `npm run build` green
- [x] Grep: no `zk-*` in slip page (and repo-wide)
- [x] Prod curl smoke after deploy — `/slip/cmqscttnw0001l404wewwr7nu` (PAID #wr7nu) HTTP 200, `bg-canvas`/`bg-canvas-soft`/`border-hairline`/`text-muted`, zero `zk-*` in SSR HTML (`dpl_2p7RSEAgq5WbQevuuaJokFpL6uDL` 2026-06-24)

## Reference

- `components/vendor/DispatchModal.tsx` — slip `<pre>` classes
- `docs/adr/0015-kds-orders-design-md-migration.md`
- `docs/adr/0016-delivery-slip-design-md-migration.md`
