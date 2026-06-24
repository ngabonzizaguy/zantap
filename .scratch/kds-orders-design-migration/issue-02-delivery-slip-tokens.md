# Issue 02 — Delivery slip page → DESIGN.md tokens

Status: **closed** (committed · local build green · zero `zk-*` in repo) · Labels: `ready-for-agent`

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
- [ ] Prod curl smoke after deploy (optional — needs live order id)

## Reference

- `components/vendor/DispatchModal.tsx` — slip `<pre>` classes
- `docs/adr/0015-kds-orders-design-md-migration.md`
- `docs/adr/0016-delivery-slip-design-md-migration.md`
