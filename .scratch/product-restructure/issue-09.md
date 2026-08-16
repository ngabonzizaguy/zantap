# Issue 09 — PWA baseline + offline kitchen-stage queue + chime

Status: **in-progress** · 09a DONE + merged to main + production deployed + curl-smoked + Android/iOS physical-device acceptance PASS 2026-08-15 · 09b ready-for-agent · Track 4 · ADR-0046 §11/§13

**Vendored design skills to consult (PRD §3b):** `mobile-app-ui-design`
(installed-app feel: touch targets, safe areas, nav/back conventions, offline
states), `ui-ux-pro-max` (UX guidelines: touch ≥44px, loading feedback, CLS,
reduced motion), `frontend-design`. DESIGN.md/ADRs win on conflict.

Baseline (09a):
- [x] Web app manifest: Z icons (from approved set), name/short_name, theme colors per surface, `display: standalone`.
- [x] Installability verified on Android Chrome (storefront + KDS coexist, launch standalone, and retain the offline fallback in airplane mode); iOS Add to Home Screen also verified.
- [x] Service worker: cache-first for static shell/brand assets ONLY; network-first for data; explicit versioned update strategy; NEVER cache API/SSE/payment responses.
- [x] Clear offline UI states on storefront + KDS (read-only shell + "you're offline").
- [x] Dark KDS tappable controls retain their resting background through hover/active states (no sticky light overlay after tap/click).
- [x] Orders stage chips use a contained, swipeable rail that never widens the KDS document.

Offline stage queue (09b — the ONLY offline writes, server wins):
- [ ] Queue accept/preparing/ready kitchen-stage moves while offline (localStorage/IDB), replay on reconnect.
- [ ] Server-state-wins on conflict; UI shows per-ticket "failed to sync" when replay is rejected; no retry storms.
- [ ] Payments, menu edits, dispatch, profile changes never queue — enforce at the queue boundary, not per-callsite.
- [ ] KDS new-order chime (audible while open; respects a mute toggle) — pilot notification model.
- [ ] Tests for queue replay/conflict; `npm run build`; airplane-mode manual smoke.
- [ ] ADR (offline model).
- [ ] Handoff per protocol.

09a evidence (2026-08-08, branch `codex/pwa-kds-paypack-polish`): root and
vendor-specific KDS manifests, 192/512 `any` + `maskable` approved-Z icons,
production-only SW registration, versioned static-shell cache, `/offline`
fallback, and a safe-area offline status. Local prod HTTP + responsive browser
checks pass. A 390×844 interaction audit also verifies stable backgrounds across
all KDS tabs, tickets, filters, Setup, Help, and modal controls with zero console
errors. The automation browser hides Service Worker APIs, so the final install
and offline checks were performed on physical devices. ADR-0051.
The approved commits were replayed cleanly onto `origin/main` as `0b685ea` +
`1cf4a5a`, excluding unaudited durable-leads commit `2d6e391`. Production
deployment `dpl_6yTBeB4YTo8cdDuBf3ahVgmTS8yn` is Ready at `zantap.app`; curl
smoke and runtime error scan pass. On 2026-08-15 the owner confirmed PASS for
Android storefront + KDS install/coexistence, standalone launches and
airplane-mode fallback, plus iOS Add-to-Home-Screen behavior. This closes 09a;
09b offline kitchen-stage writes and the in-app order chime remain separate.
