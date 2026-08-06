# Issue 04 — Durable lead capture through the Store seam

Status: **✅ DONE LOCAL · ready for migration/deploy · not deployed 2026-08-06 (ADR-0050)** · Track 1 · ADR-0046 §9

- [x] `Lead` model: id, businessName, businessType, contactName, phone (E.164 via existing canonicalizePhone), area, message?, status (NEW/CONTACTED/ONBOARDED/CLOSED), source?, consentAt, createdAt.
- [x] Store verbs on the seam (`lib/store/`): `createLead`, `listLeads`, `updateLeadStatus` — implemented in BOTH adapters (in-memory + Prisma) + contract tests.
- [x] Prisma migration created at `20260806213500_durable_lead_capture` (not applied: this session explicitly excludes deploy; apply with `npm run db:deploy` through `DIRECT_URL` before deployment).
- [x] `"use server"` action `submitLead` in `lib/actions/` — async-only exports, schema-style runtime validation, per-IP/per-phone rate limits, honeypot field.
- [x] No client Store import; browser touches only the action.
- [x] Unit + contract tests; `npm run build`. (`npx prisma validate`, `git diff --check`, lint, 263 passed / 80 Prisma-gated skipped, production build all green.)
- [x] Handoff per protocol.

Implementation note: rate limits are best-effort in-process buckets (10/IP per
15 minutes; 3/phone per hour), matching the existing public-action limiter's
serverless caveat. Lead persistence itself is durable through Prisma/Postgres.
No deployment or migration application was performed.
