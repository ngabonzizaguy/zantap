# Issue 01 — Z brand rollout in-product

Status: **✅ DONE · deployed with Issue 03 · prod-smoked 2026-08-06 (ADR-0048)** · Track 1 · ADR-0046 §4

Replace the circular food medallion with the approved black-and-amber Z
(`public/brand/approved-z/`) across every product surface. Assets exist; no new
art. Alpha-trim/downscale lessons from ADR-0027 apply (source art may fill only
part of its canvas).

- [x] Inventory every medallion usage: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, onboarding splash + "You're Live" hero, KDS `MetricsBanner`, any `next/image` brand refs. (Four component refs found: `SplashStep`, `LiveStep`, `MetricsBanner`, `OpsShell` — all replaced. `zantap-logo-2.png` kept: it is the Z identity source referenced by proofs docs, not a medallion.)
- [x] Replace favicon set from `zantap-z-favicon-{32,64,180,512}.png`. (512 → `app/icon.png`, 180 → `app/apple-icon.png`, 32+64 packed into `app/favicon.ico` via `.scratch/product-restructure/build-favicon-ico.mjs`.)
- [x] Replace in-app logo/hero usages with the Z mark / wordmark variants; verify sizing on dark (`.kds-dark`) and light surfaces (black/white mark variants exist). (Mapping decided in ADR-0048: dark surfaces = off-white avatar tile with rounded-square corners — the transparent mark is 85% near-black and invisible on dark, and circular crop clips the Z; light ops sidebar = transparent full-color mark.)
- [x] Retire (delete or move to `public/brand/proofs/rejected/`) the medallion files once nothing references them. (`git mv public/brand/zantap-logo.png public/brand/proofs/rejected/zantap-logo-medallion.png`.)
- [x] `npm run build` + visual check of onboarding, KDS header, storefront, browser tab icon. (Build + lint clean; Playwright screenshots at 390px in `.scratch/product-restructure/issue-01-shots/` — splash, KDS header, storefront all pass; `/favicon.ico`, `/icon.png`, `/apple-icon.png` serve 200 with correct content types. "You're Live" hero not exercised live — would require provisioning a vendor against the real DB — but uses the identical asset/tile pattern as the verified splash; ops sidebar behind ops auth, code-verified only.)
- [x] Handoff: tick boxes, update candidates table, ADR only if a decision beyond ADR-0046 arises. (ADR-0048: per-surface variant mapping + favicon tile treatment superseding ADR-0027's round-transparent choice.)

Committed in `877cef0`, carried by the Issue 03 fast-forward to `main`, and deployed
with production deployment `zantap-qv9d8y90w` at `https://zantap.app`.
