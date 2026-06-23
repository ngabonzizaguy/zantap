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

### Deploy gotcha (RESOLVED 2026-06-23)
- Vercel **Production** env originally had only `POSTGRES_*` names (from the Supabase integration), while the app reads `DATABASE_URL`/`DIRECT_URL`. This is now fixed: `DATABASE_URL` and `DIRECT_URL` are set in Production (confirmed via `vercel env ls production`), so the deployed app connects through the Prisma adapter and reads/writes persist. Leave this note as resolved — do **not** re-theorize prod DB failures as a missing env var without re-checking `vercel env ls`.

### Lessons learned (read before debugging prod / touching server actions)
- **`"use server"` files export ONLY async server actions.** Never `export type`, re-export, or export a non-async value from `lib/actions/*`. Next.js registers every export as a server reference; a type re-export compiles to an **undefined runtime identifier in the production build** → `ReferenceError` on module load → **every** action in that file 500s. Import types from their source module (e.g. `@/lib/kds/types`) instead. (Root cause of known-issue 0002.)
- **Dev-green ≠ prod-green.** Turbopack dev tolerates things that `next build` / the production runtime reject (the above bug reproduced only in prod). After editing a `"use server"` file or anything bundler-sensitive, run `npm run build` before trusting it — a passing dev server is not proof.
- **Diagnose prod failures with prod evidence first.** For a production-only error, pull the real message before theorizing about infrastructure: `vercel ls` → copy the Production deployment URL → `vercel logs <url>`, or use the Vercel MCP `get_runtime_logs` when the integration is scoped to this project. One log line (`ReferenceError: KdsSnapshot is not defined`) ended a long, wrong pgbouncer/DB hypothesis here.
- **KDS order visibility is status-gated.** Only `PAID`/`DISPATCHED`/`COMPLETED` orders reach the kitchen; a `PENDING` order exists between the customer tapping "Pay" and authorizing the MoMo PIN. Never render a payment badge ("PAID via MoMo") independent of `order.status`, and filter the KDS read seam (`fetchKdsSnapshot`), not just the UI.
- **Keep these operational notes current.** A stale "not yet resolved" note above contributed to a wrong first hypothesis. When reality changes, update the note in the same session.

### Security
- The Supabase DB password was exposed in chat once and should be rotated (Settings → Database → Reset password), then update `.env` and the Vercel synced var.

### Status
- Issue 01 (Store seam, in-memory) and Issue 02 (Prisma adapter, migration, seed) are committed and verified (30/30 contract tests green against real Supabase Postgres). Issue 03 (wire MoMo through Store, delete Map) is done — 53/53 tests green including simulate integration tests.
- Known-issue 0002 fixed & deployed 2026-06-23: KDS action buttons 500 in prod (a `"use server"` type re-export — see Lessons learned) and orders showing "PAID via MoMo" before payment.
- Known-issue 0002 Symptom C fixed 2026-06-23 (committed; **pending deploy/verify in prod**): the KDS SSE stream timed out every ~5min on Vercel. Fix = the route self-closes at `MAX_STREAM_MS = 250_000` (clean `controller.close()` so the function returns ~50s before Vercel's kill → no "Task timed out" logged) with `export const maxDuration = 300`, plus client reconnect backoff in `lib/kds/useKdsLiveSnapshot.ts`. Transport-only, behind the Store seam. See `docs/adr/0004-kds-sse-self-close-and-reconnect-backoff.md` and `docs/known-issues/0002`.
