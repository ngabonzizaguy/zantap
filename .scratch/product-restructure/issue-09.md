# Issue 09 — PWA baseline + offline kitchen-stage queue + chime

Status: **ready-for-agent** · Track 4 · ADR-0046 §11/§13 (suggest splitting into 09a manifest/shell and 09b queue at session time)

Baseline (09a):
- [ ] Web app manifest: Z icons (from approved set), name/short_name, theme colors per surface, `display: standalone`.
- [ ] Installability verified on Android Chrome (KDS on kitchen tablets is a selling point).
- [ ] Service worker: cache-first for static shell/brand assets ONLY; network-first for data; explicit versioned update strategy; NEVER cache API/SSE/payment responses.
- [ ] Clear offline UI states on storefront + KDS (read-only shell + "you're offline").

Offline stage queue (09b — the ONLY offline writes, server wins):
- [ ] Queue accept/preparing/ready kitchen-stage moves while offline (localStorage/IDB), replay on reconnect.
- [ ] Server-state-wins on conflict; UI shows per-ticket "failed to sync" when replay is rejected; no retry storms.
- [ ] Payments, menu edits, dispatch, profile changes never queue — enforce at the queue boundary, not per-callsite.
- [ ] KDS new-order chime (audible while open; respects a mute toggle) — pilot notification model.
- [ ] Tests for queue replay/conflict; `npm run build`; airplane-mode manual smoke.
- [ ] ADR (offline model).
- [ ] Handoff per protocol.
