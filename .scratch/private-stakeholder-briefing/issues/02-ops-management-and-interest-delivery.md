# Issue 02 — Briefing Ops management and interest capture

Status: **implemented and verified locally · deployment pending**

Complete the durable management slice already approved in ADR-0072,
ADR-0076, and ADR-0077. The viewer remains free of Ops references; authenticated
Operators manage it from a dedicated `/ops/briefing` area.

- [x] Persist immutable published Briefing versions and one editable draft.
- [x] Create recipient-specific Access grants with one-time readable secrets,
  expiry, revocation/reset, version pinning, share kit, and two-session limit.
- [x] Replace the environment-only viewer gate with grant/session enforcement,
  acknowledgement, countdown expiry, and attributable watermark data.
- [x] Persist privacy-limited activity and expose it in Ops.
- [x] Persist Briefing-interest submissions and expose them in Ops.
- [x] Record every interest submission in ZanTap Ops for private follow-up.
  Email delivery is deliberately omitted from this release.
- [x] Add structured content, Access, activity, and interest management under
  `/ops/briefing` using `DESIGN.md`.
- [ ] Add migrations, Store adapter contract coverage, focused UI/action tests,
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
- Deployment and production smoke remain pending.
