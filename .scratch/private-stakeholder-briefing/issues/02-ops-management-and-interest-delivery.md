# Issue 02 — Briefing Ops management and interest capture

Status: **4-digit PIN repair deployed · read-only production smoke passed**

Complete the durable management slice already approved in ADR-0072,
ADR-0076, and ADR-0077. The viewer remains free of Ops references; authenticated
Operators manage it from a dedicated `/ops/briefing` area.

- [x] Persist immutable published Briefing versions and one editable draft.
- [x] Create recipient-specific Access grants with one-time readable secrets,
  expiry, revocation/reset, version pinning, and share kit.
- [x] Replace new/reset secrets with collision-checked four-digit PINs, keep the
  PIN input visible even when legacy preview access is expired or unavailable,
  and allow every holder of an active PIN to create a viewing session.
- [x] Preserve legacy long-secret verification until each existing grant is
  reset, and rate-limit PIN unlock attempts without storing plaintext PINs.
- [x] Replace the environment-only viewer gate with grant/session enforcement,
  acknowledgement, countdown expiry, and attributable watermark data.
- [x] Persist privacy-limited activity and expose it in Ops.
- [x] Persist Briefing-interest submissions and expose them in Ops.
- [x] Record every interest submission in ZanTap Ops for private follow-up.
  Email delivery is deliberately omitted from this release.
- [x] Add structured content, Access, activity, and interest management under
  `/ops/briefing` using `DESIGN.md`.
- [x] Add migrations, Store adapter contract coverage, focused UI/action tests,
  production build, responsive browser QA, deploy, and production smoke.

## Boundaries

- No Ops wording, controls, links, or screenshots appear in `/briefing`.
- Secrets are stored only as slow hashes and plaintext is shown only at
  creation/reset in the share kit.
- No keystrokes, cursor replay, screen recording, invasive heatmaps, or unsent
  form text are collected.
- Durable Ops capture is the source of truth; this release has no email-provider
  dependency or email-delivery status.

## Verification record

- Migration `20260827150500_briefing_management` applied successfully on
  2026-08-27.
- Focused Briefing suite: 8/8 passing.
- Full suite: 432 passing / 117 skipped.
- Clean `npm run build`: passing; `/briefing` and `/ops/briefing` included.
- Mobile browser QA at 405×812: numeric-only countdown, tightened story cue,
  far-right watermark, no browser errors, and interest form success confirmed.
- Production deployment `dpl_7VH4EeKGVJADUzAKgQnR2xgiLvJK` is Ready and
  aliased to `zantap.app`; gate/unlock/mobile viewer and `/ops/briefing` auth
  redirect pass, with zero browser or sampled runtime errors.
- Authenticated owner walkthrough of grant creation and the first real interest
  appearing in Ops remains pending; production was not polluted with a fake
  stakeholder message.

## Four-digit PIN repair verification — 2026-09-01

- Focused Briefing secret/service/gate tests pass 6/6.
- A headed Ops browser generated a four-digit PIN; a separate browser entered
  it through the always-visible expired-access gate and reached the Viewer
  acknowledgement. No application console errors were recorded.
- Ops date labels now use a fixed Kigali locale/time zone so server and browser
  hydration are deterministic.
- The access-gate footer now uses the owner-approved subtle label “Private
  viewing” instead of the longer prohibition.
- Exact HEAD `5bd7d87` is deployed READY as Production
  `dpl_5kvk1NEtjwtgK66oMBKmn3n5TFbv` on `zantap.app`. Live HTML includes
  “four-digit PIN” and “Private viewing”; release-log scans are clean.
