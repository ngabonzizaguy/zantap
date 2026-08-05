# Issue 01 — Z brand rollout in-product

Status: **ready-for-agent** · Track 1 · ADR-0046 §4

Replace the circular food medallion with the approved black-and-amber Z
(`public/brand/approved-z/`) across every product surface. Assets exist; no new
art. Alpha-trim/downscale lessons from ADR-0027 apply (source art may fill only
part of its canvas).

- [ ] Inventory every medallion usage: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, onboarding splash + "You're Live" hero, KDS `MetricsBanner`, any `next/image` brand refs.
- [ ] Replace favicon set from `zantap-z-favicon-{32,64,180,512}.png`.
- [ ] Replace in-app logo/hero usages with the Z mark / wordmark variants; verify sizing on dark (`.kds-dark`) and light surfaces (black/white mark variants exist).
- [ ] Retire (delete or move to `public/brand/proofs/rejected/`) the medallion files once nothing references them.
- [ ] `npm run build` + visual check of onboarding, KDS header, storefront, browser tab icon.
- [ ] Handoff: tick boxes, update candidates table, ADR only if a decision beyond ADR-0046 arises.
