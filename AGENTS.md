# ZanTap — Agent Instructions

Project-specific behavioral rules also live in `.cursorrules` (UI boundaries, anti-YOLO protocol, MoMo grilling trigger). This file holds the configuration that the installed Matt Pocock engineering skills read.

## MANDATORY: Session handoff protocol (non-negotiable — applies to EVERY session)

Work is run one task per session to keep context token-light. A new session
inherits ONLY what is on disk — never the previous chat. Therefore, when a
session completes its task (or is told to wrap up), you MUST ALWAYS, without
being reminded, do BOTH of the following before ending your turn:

1. **Persist state to disk** (the cross-session source of truth):
   - tick the relevant issue-file checkboxes and update its `Status` line;
   - update the status table in `.scratch/architecture-candidates.md`;
   - record any design decisions as an ADR under `docs/adr/` (git-tracked).
2. **Print the next session's prompt** — a single copy/paste-ready fenced code
   block stating what was just completed, what comes next, and exactly which
   files the next agent should read. The user starts the next session by pasting
   it verbatim.

This is not optional and must never be skipped or forgotten. A task session that
ends without (1) persisting state and (2) emitting the next-session prompt is
incomplete. If you are ever unsure, re-read this section and comply.

## Agent skills

### Issue tracker

Issues and PRDs live as local markdown files under `.scratch/<feature-slug>/`. No GitHub round-trips. See `docs/agents/issue-tracker.md`.

### Triage labels

Stock five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Operational notes (read before DB / deploy work — avoid known mistakes)

### Data layer architecture (do not violate)
- The **Store** is the single server-only data seam (`lib/store/`): one interface, two adapters — in-memory (`lib/store/in-memory.ts`, tests/dev) and Prisma/Postgres (`lib/store/prisma.ts`, prod). The browser never imports the Store; client mutates via Server Actions (`lib/actions/`), RSC reads it directly.
- The factory `getStore()` returns the Prisma adapter when `DATABASE_URL` is set, in-memory otherwise.
- **Do NOT add a competing data path.** Auth/RLS via `@supabase/ssr` or `@supabase/server` is deliberately deferred; when auth is added it gets its own `/grill-with-docs` + PRD. Don't wire Supabase client SDKs ad hoc.

### Local DB verification (how to run the Prisma path)
- Credentials live in `.env` (gitignored): `DATABASE_URL` (Supabase pooled, 6543, `pgbouncer=true`), `DIRECT_URL` (session pooler, 5432, for migrations), `TEST_DATABASE_URL` (= DIRECT_URL + `?schema=zantap_test`, isolated test schema).
- Prisma CLI auto-loads `.env`. **vitest does NOT** — `vitest.config.ts` loads it via `loadEnv` and sets `hookTimeout: 90000` / `testTimeout: 30000` because the remote DB suite is slow (~155s). Keep those timeouts.
- Verify: `npm run db:deploy` → `npm run db:seed` → `npm test`. The Prisma contract suite auto-skips when `TEST_DATABASE_URL` is unset.

### Deploy gotcha (not yet resolved)
- Vercel **Production** env has only `POSTGRES_*` names (from the Supabase integration), but the app reads `DATABASE_URL`/`DIRECT_URL`. Before the deployed app can connect, either add `DATABASE_URL`/`DIRECT_URL` in Vercel (map from `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`) or point the schema/factory at the `POSTGRES_*` names.

### Security
- The Supabase DB password was exposed in chat once and should be rotated (Settings → Database → Reset password), then update `.env` and the Vercel synced var.

### Status
- Issue 01 (Store seam, in-memory) and Issue 02 (Prisma adapter, migration, seed) are committed and verified (30/30 contract tests green against real Supabase Postgres). Issue 03 (factory auto-selection + dual-adapter contract suite) is largely already implemented inside 02; running it is mostly confirmation.
