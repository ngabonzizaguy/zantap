# Issue 04 — Durable lead capture through the Store seam

Status: **✅ DONE · DEPLOYED · PROD-SMOKED 2026-08-09 (ADR-0050)** · Track 1 · ADR-0046 §9

Deploy 2026-08-09: owner approved after Cursor audit (clean: async-only action
exports, both adapters + contract tests, honeypot/rate limits, no client Store
import; replay conflict-free — main tip vs branch tip differed ONLY by the 15
lead files). `2d6e391` cherry-picked onto main as `c79738e` → pushed → auto
Vercel Production `zantap-lxwwvr7vs` → alias `zantap.app`. Fresh validation on
replay: lint clean, 266 passed / 80 skipped, `npm run build` green. Prod smoke
PASS (`.scratch/product-restructure/lead-capture-prod-smoke.mjs`, msedge via
playwright-core --no-save): live form submit → Server Action POST 200 →
success state; DB row verified via `lead-capture-db-check.mjs`
(`prod-smoke-lead-1786274599885`, phone canonicalized `250788123456`, status
NEW, source marketing-root — left in place, clearly labeled). Note: first
smoke attempt timed out on cold start WITHOUT persisting (fail-safe). The
WhatsApp interim transport is now retired; follow-up works from the DB until
Issue 05 ships the Ops lead inbox (now unblocked).

- [x] `Lead` model: id, businessName, businessType, contactName, phone (E.164 via existing canonicalizePhone), area, message?, status (NEW/CONTACTED/ONBOARDED/CLOSED), source?, consentAt, createdAt.
- [x] Store verbs on the seam (`lib/store/`): `createLead`, `listLeads`, `updateLeadStatus` — implemented in BOTH adapters (in-memory + Prisma) + contract tests.
- [x] Prisma migration `20260806213500_durable_lead_capture` applied successfully with `npm run db:deploy` before Production promotion.
- [x] `"use server"` action `submitLead` in `lib/actions/` — async-only exports, schema-style runtime validation, per-IP/per-phone rate limits, honeypot field.
- [x] No client Store import; browser touches only the action.
- [x] Unit + contract tests; `npm run build`. (`npx prisma validate`, `git diff --check`, lint, 263 passed / 80 Prisma-gated skipped, production build all green.)
- [x] Handoff per protocol.

Implementation note: rate limits are best-effort in-process buckets (10/IP per
15 minutes; 3/phone per hour), matching the existing public-action limiter's
serverless caveat. Lead persistence itself is durable through Prisma/Postgres.
Migration `20260806213500_durable_lead_capture` remains applied and harmless.
The implementation was temporarily present in branch-based Production
`dpl_ED9R4U5FXfpCcRpx6eFHrtVjUhy4`, then deliberately excluded from the next
clean-main deployment while the owner requested an audit. After that audit it
was replayed to main as `c79738e`; current Production includes the durable Lead
path. The earlier `dpl_6yTBeB4YTo8cdDuBf3ahVgmTS8yn` omission is historical.
