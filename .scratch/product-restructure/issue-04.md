# Issue 04 — Durable lead capture through the Store seam

Status: **ready-for-agent** · Track 1 · ADR-0046 §9

- [ ] `Lead` model: id, businessName, businessType, contactName, phone (E.164 via existing canonicalizePhone), area, message?, status (NEW/CONTACTED/ONBOARDED/CLOSED), source?, consentAt, createdAt.
- [ ] Store verbs on the seam (`lib/store/`): `createLead`, `listLeads`, `updateLeadStatus` — implemented in BOTH adapters (in-memory + Prisma) + contract tests.
- [ ] Prisma migration (deploy via `db:deploy`; remember `DIRECT_URL` path).
- [ ] `"use server"` action `submitLead` in `lib/actions/` — async-only exports (see AGENTS.md lesson), zod-style validation, per-IP/per-phone rate limit, honeypot field.
- [ ] No client Store import; browser touches only the action.
- [ ] Unit + contract tests; `npm run build`.
- [ ] Handoff per protocol.
