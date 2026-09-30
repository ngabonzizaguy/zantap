# ZanTap — Agent Instructions

Project-specific behavioral rules also live in `.cursorrules` (UI boundaries, anti-YOLO protocol, MoMo grilling trigger). This file holds the configuration that the installed Matt Pocock engineering skills read.

## Cursor Cloud specific instructions

The Cloud Agent VM is **Linux/bash** (not the human's Windows PowerShell — the "host = Windows PowerShell" gotchas below do NOT apply on the cloud VM; use `&&`, heredocs, etc. normally). Dependencies are refreshed on startup by the update script (`npm install`, which runs `prisma generate` via `postinstall` — no DB needed). Standard commands live in `README.md` / `package.json`; only the non-obvious cloud caveats are below.

- **No database or external service is required to develop.** With `DATABASE_URL` unset, `getStore()` uses the in-memory Store (`lib/store/in-memory.ts`) seeded with demo vendor `inka-steakhouse`. The four surfaces (`/inka-steakhouse` storefront, `/vendor/inka-steakhouse` KDS, `/onboard`, `/ops`) all work without Postgres, Blob, or a payment provider. Only set `DATABASE_URL`/`DIRECT_URL` + run `npm run db:deploy && npm run db:seed` if you specifically need to exercise the Prisma/Postgres path.
- **Run exactly one dev server.** `npm run dev` serves everything on `http://localhost:3000` (App Router + all API routes + KDS SSE — no separate processes). Starting a second `next dev` fights over port 3000 and produces confusing hangs; if a server is already running (check the `zantap-dev` tmux session / port 3000), reuse it instead of launching another.
- **MoMo is `simulate` in dev** (`NODE_ENV!=production` → sandbox STK). Pay with **PIN `12345`**. Production defaults to `manual` USSD.
- **Checkout Pay button gotcha:** the storefront "Pay securely with MoMo" button stays disabled until ALL THREE delivery fields are filled — Phone (`078XXXXXXX`), Delivery **sector**, and **Landmark**. Missing the Landmark field silently blocks payment (`canProceedToPay`). Fill all three when smoke-testing an order.
- **KDS visibility is status-gated:** only `PAID`/`DISPATCHED`/`COMPLETED` orders reach `/vendor/[slug]`. After paying (PIN `12345`) the order appears as a `NEW` ticket "Paid via MoMo". The KDS auto-opens "Kitchen status" + "Setup guide" overlays on first load — dismiss them to see the queue.
- **Tests:** `npm test` runs Vitest; the `#prisma` contract suite is **skipped by default** (`SKIP_PRISMA_TESTS=1`, no `TEST_DATABASE_URL`) — a green run of ~253 passed / ~77 skipped is expected and correct without a DB. `npm run lint` and `npm run build` are both clean.

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

### Shared Cursor/Codex continuity

For work that touches the product restructure, marketing funnel, lead capture,
PWA/KDS polish, offline queue, or Paypack preparation, read and maintain
`docs/agents/codex-cursor-shared-handoff.md`. It is the common prompt that
reconciles what each agent stream changed, what actually shipped, and which
work remains local or gated. Update it in the same session whenever those facts
change; detailed truth still belongs in the relevant issue, ADR, commit, and
deployment record.

## Agent skills

### Issue tracker

Issues and PRDs live as local markdown files under `.scratch/<feature-slug>/`. No GitHub round-trips. See `docs/agents/issue-tracker.md`.

### Triage labels

Stock five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## AI Agent Working Protocol

When working on this repository, AI agents must follow this protocol:

### 1. Read the context first

Before making any changes:
- Read `AGENTS.md` (this file)
- Read `README.md` for current system overview
- Read `docs/architecture.md` for architectural details
- Read `CONTEXT.md` for domain terminology
- Read relevant ADRs from `docs/adr/` for the area being modified

### 2. Inspect the current implementation

Never assume documentation is current:
- Search for existing abstractions before creating new ones
- Read the actual implementation files
- Verify that documented features actually exist
- Check whether a feature is implemented, partially implemented, or deferred

### 3. Respect the Store seam

Critical invariant:
- The browser never imports the Store
- All persistence must pass through the Store interface
- Never add a competing data path
- Never bypass the Store seam with direct Prisma calls in business logic

### 4. Follow Server Action conventions

For `"use server"` files:
- Export ONLY async server actions
- Never export types from these files
- Never re-export non-async values
- Import types from their source module instead
- Run `npm run build` after editing to verify (dev ≠ prod)

### 5. Check payment mode before changing checkout

- Check current MOMO_MODE (simulate, manual, openapi)
- Manual mode is production default
- Open API is local only, awaiting owner approval
- Do not change production payment mode without explicit instruction

### 6. Respect owner token authorization

- Owner tokens are per-vendor capability tokens
- Guarded writes require owner token validation (assertOwnerToken)
- Owner token is cached by slug, never typed
- Phone-based recovery is available (recoverOwnerToken)
- Do not bypass owner token guard without operator override

### 7. Use existing design system tokens

- Follow `DESIGN.md` for UI components
- KDS uses scoped `.kds-dark` remap
- Storefront uses editorial tokens
- Do not add new legacy palettes (zt-*, zk-* are deprecated)

### 8. Avoid duplicate implementations

- Search for existing code before implementing
- Reuse existing domain modules
- Follow established patterns
- Do not create competing data paths

### 9. Run verification before declaring completion

Always run:
- `npm test` (tests)
- `npm run lint` (linting)
- `npm run build` (type check and build)

Fix any failures before considering the task complete.

### 10. Update documentation when architecture changes

- Create/update ADR for significant architectural decisions
- Update relevant sections in AGENTS.md
- Update README.md if user-facing behavior changes
- Update docs/architecture.md if data flow changes
- Keep CONTEXT.md current with new terminology

### 11. Never claim something is implemented unless it exists

- Document actual state, not intended state
- Mark deferred/experimental features clearly
- Use "Unknown / requires verification" when uncertain
- Do not invent features or capabilities

### 12. Never silently remove existing functionality

- Check usage before removing code
- Update documentation when deprecating
- Provide migration path when breaking changes are necessary
- Do not remove features without explicit instruction

### 13. Never expose secrets or credentials

- Never write real credentials to documentation
- Never log secrets or tokens
- Never commit secrets to git
- Use environment variables for secrets

### 14. Prefer small, reversible changes

- Make incremental changes
- Keep changes focused on one task
- Test after each change
- Easy to revert if something goes wrong

### 15. Preserve existing UX/design-system conventions

- Match existing component patterns
- Follow established interaction patterns
- Respect existing terminology
- Do not introduce inconsistent UX

### 16. Check feature flags before assuming behavior

- Check per-vendor feature flags (featureWhatsappNotify, featureStockTracking, featureProfitInsights)
- Check global settings (CommissionSettings.globalEnabled)
- Check PROVISION_KILL_SWITCH before assuming signup is open
- Do not assume a feature is available for all vendors

### 17. Verify KDS behavior in production context

- KDS orders are status-gated (PAID/DISPATCHED/COMPLETED only)
- PENDING orders do not appear on KDS
- Kitchen stage is separate from payment status
- SSE stream self-closes at 250s with client reconnect

### 18. Test payment flows carefully

- Manual mode: USSD dial + self-confirm
- Simulate mode: PIN 12345
- Open API mode: Collection → webhook → payout (local only)
- Do not assume all payment modes work the same

### 19. Handle database connection correctly

- Use DATABASE_URL for pooled connection (port 6543)
- Use DIRECT_URL for migrations (port 5432)
- TEST_DATABASE_URL uses direct connection (not pooler)
- Prisma CLI auto-loads .env, but vitest does not

### 20. Know when to ask for clarification

If you encounter:
- Conflicting documentation
- Unclear requirements
- Ambiguous architectural decisions
- Potential security implications

Stop and ask for clarification rather than guessing.

## Current Feature Status

This section provides a quick reference for agents to understand what is implemented, partially implemented, or deferred.

### Core Platform

| Feature | Status | Notes |
|---|---|---|
| Store seam (in-memory + Prisma) | Implemented | Single data seam, factory pattern |
| Next.js App Router | Implemented | All surfaces use App Router |
| TypeScript | Implemented | Full codebase typed |
| Tailwind CSS | Implemented | DESIGN.md tokens + custom KDS dark theme |
| Prisma ORM | Implemented | PostgreSQL schema management |
| Vercel deployment | Implemented | Production on zantap.app |

### Customer Experience

| Feature | Status | Notes |
|---|---|---|
| Storefront (`/[slug]`) | Implemented | Editorial hero, menu, cart |
| Menu browsing | Implemented | Categories, search, filters |
| Cart management | Implemented | Add/remove items, quantity |
| Item customization | Implemented | Add-ons, size options, notes |
| Checkout flow | Implemented | Validation, delivery fields |
| Manual MoMo payment | Implemented | USSD dial + self-confirm (production) |
| Simulate MoMo payment | Implemented | PIN 12345 (local dev) |
| Open API payment | Local only | Collection + payout implemented, awaiting owner approval |
| Restaurant hub | Implemented | PWA install, saved restaurants, updates |
| PWA customer app | Implemented | Per-storefront manifest |

### Vendor Experience

| Feature | Status | Notes |
|---|---|---|
| KDS (`/vendor/[slug]`) | Implemented | Orders, menu, history, drivers, setup |
| Kitchen stages | Implemented | NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED |
| Order management | Implemented | View, filter, sort, bulk actions |
| Menu CRUD | Implemented | Create, update, archive, restore |
| Menu media | Implemented | Multi-image gallery, primary image |
| Add-ons | Implemented | Item-specific add-on groups, server-priced |
| Size options | Implemented | Dynamic size options with price variants |
| Drivers | Implemented | CRUD, assignment, dispatch modal |
| Order history | Implemented | Filters, pagination, CSV/XLSX export |
| Profit insights | Implemented | Expenses, period profit, cost prices |
| Stock tracking | Implemented | Dish-level stock, low-stock thresholds |
| Vendor updates | Implemented | Automatic public catalog feed |
| KDS translations | Implemented | en/rw/fr/sw with Ops-controlled availability |
| KDS readiness guide | Implemented | Replayable onboarding education |
| KDS dark theme | Implemented | Scoped .kds-dark CSS remap |
| PWA KDS app | Implemented | Per-vendor manifest |

### Onboarding

| Feature | Status | Notes |
|---|---|---|
| Self-serve onboarding | Implemented | Gate-free wizard, owner token |
| Business essentials | Implemented | Slug availability, country, category |
| Payments setup | Implemented | Payout method (phone/merchant code) |
| Quick menu | Implemented | First dish, category, optional photo |
| Review step | Implemented | Editable cards before submission |
| You're Live | Implemented | Confetti, storefront URL, QR code |
| Owner token | Implemented | Per-vendor capability token, cached by slug |
| Phone-based recovery | Implemented | Non-halting recovery + recovery event |
| Recovery event logging | Implemented | Server-side log for Ops review |

### Operator Console

| Feature | Status | Notes |
|---|---|---|
| Ops login | Implemented | OPERATOR_UI_SECRET |
| Vendor directory | Implemented | List, filter, search vendors |
| Vendor detail | Implemented | Full vendor info, audit log |
| Vendor suspension | Implemented | Suspend/reactive vendors |
| Owner token management | Implemented | Revoke/reissue owner tokens |
| Lead inbox | Implemented | View, update status, assign routing |
| Lead routing settings | Implemented | Multi-recipient WhatsApp routing |
| Recovery inbox | Implemented | View recovery events, review notes |
| Prospect inbox | Implemented | Outbound prospect tracking |
| Menu intake review | Implemented | Review, edit, import, delete |
| KDS language settings | Implemented | Ops-controlled availability (en/rw/fr/sw) |
| Marketing settings | Implemented | Social links, contact info |
| Site translations | Implemented | Ops-edited marketing copy |
| Commission settings | Implemented | Global + per-Vendor controls (inactive until Open API) |
| Briefing management | Implemented | Access grants, versions, interests |
| Marketing insights | Implemented | Privacy-minimal funnel analytics |

### Marketing

| Feature | Status | Notes |
|---|---|
| Marketing homepage (`/`) | Implemented | Cinematic hero, scroll-world preview |
| Lead capture form | Implemented | Durable, Rwanda E.164 phone |
| Scroll-world preview | Implemented | Zero-credit still crossfade preview |
| Language switcher | Implemented | en/rw/fr/sw selector |
| Lead routing | Implemented | Multi-recipient WhatsApp routing |
| Privacy-minimal analytics | Implemented | Funnel events, no PII |

### Private Briefing

| Feature | Status | Notes |
|---|---|---|
| Access grants | Implemented | Recipient-specific, 4-digit PIN |
| Viewing sessions | Implemented | Max 2 sessions per grant |
| Session expiry | Implemented | Authoritative even during active session |
| Watermarking | Implemented | Abstract fingerprint + recipient mark |
| Viewer acknowledgement | Implemented | One-time confidentiality notice |
| Briefing versioning | Implemented | Immutable pinned versions |
| Evidence management | Implemented | Curated snapshots, not live data |
| Activity tracking | Implemented | Privacy-limited engagement history |
| Interest submission | Implemented | Ops inbox for follow-up |

### Menu Intake

| Feature | Status | Notes |
|---|---|---|
| Public intake page | Implemented | Self-build or assisted paths |
| Structured dishes | Implemented | Mirror KDS catalog fields |
| Source media upload | Implemented | Private Blob storage |
| Drafts autosave | Implemented | Local persistence before submission |
| Resume access | Implemented | Credential-based, expires in 30 days |
| Ops review | Implemented | Edit, answer questions, select destination |
| Import to KDS | Implemented | Create/update vendor menu |
| Private source storage | Implemented | Separate Blob store |
| Ops trash/restore | Implemented | Soft delete with 30-day purge |
| Language support | Implemented | en/rw/fr/sw form |

### Infrastructure

| Feature | Status | Notes |
|---|---|---|
| Supabase PostgreSQL | Implemented | Production database |
| Vercel Blob | Implemented | Menu media + private intake storage |
| SSE live updates | Implemented | KDS stream with self-close + reconnect |
| KDS order pagination | Implemented | Realtime boundary, later-page stability |
| Pooler egress optimization | Implemented | Revision-first polling (ADR-0023) |
| Test infrastructure | Implemented | Vitest, contract tests, Prisma suite opt-in |

### Deferred

| Feature | Notes |
|---|---|
| Real authentication system | Owner tokens only (candidate #12) |
| Vendor/ops auth beyond owner tokens | Candidate #12 |
| Live MTN MoMo Open API in production | Implemented locally, awaiting owner approval |
| Automatic WhatsApp Business API delivery | Manual handoff only |
| KDS fee reminder UI | Flag only implemented |
| Offline KDS queue and chime | PWA baseline shipped, offline queue deferred |
| Per-Vendor Open API mix long-term | Global cutover planned (ADR-0096) |
| Auto Vendor clawback | Manual retry only in v1 |
| On-ticket fee split for every Vendor | Commission is backend calculation only |

## Current State Snapshot

**Last audited:** 2026-09-30

**Repository state:**
- Main branch: Clean, recent commits include Commission settings (Slice 3), KDS translations, onboarding redesign
- All major surfaces implemented and deployed to production (zantap.app)
- 97 ADRs documenting architectural decisions
- Test suite: ~573 tests passing (with Prisma suite opt-in by default)
- Build: Clean (npm run build passes)
- Lint: Clean (npm run lint passes)

**Implemented:**
- Store seam (in-memory + Prisma adapters)
- Manual MoMo USSD checkout (production)
- Simulate MoMo checkout (local dev)
- Open API Collection + Vendor payout (local only, awaiting owner approval)
- Commission settings and fee snapshot (implemented but inactive)
- KDS SSE live updates with self-close and reconnect backoff
- Kitchen stages (6-stage workflow)
- Menu CRUD with multi-image gallery
- Order history with filters, pagination, export
- Self-serve onboarding (gate-free, owner token, phone-based recovery)
- Drivers and assignment
- Operator console (full vendor management, leads, recovery, routing, translations, briefing, menu intake)
- Marketing funnel with durable lead capture
- Multi-recipient WhatsApp routing
- KDS translations (en/rw/fr/sw)
- KDS dark operational theme
- Vendor menu intake (self-build/assisted, private storage, Ops review/import)
- Private stakeholder briefing (access grants, viewing sessions, evidence)
- Stock tracking (dish-level)
- Profit insights (expenses, period profit, cost prices)
- Add-ons (item-specific, server-priced)
- Size options (dynamic menu)
- Vendor updates (automatic public catalog feed)
- Restaurant hub (PWA install, saved restaurants, updates)
- PWA manifests (root, per-vendor KDS, per-storefront customer app)
- KDS readiness guide (replayable education)

**Implemented but inactive in production:**
- Open API MoMo payment (code deployed, awaiting owner approval for production cutover - business decision, not technical limitation)
- Commission (code deployed, globalEnabled defaults false until Open API is active - technical dependency)

**Why inactive:**
- Open API payment requires owner approval for Test B and production cutover (ADR-0096)
- Commission is tied to Open API payment flow (ADR-0097)
- Both can be activated via configuration without additional code deployment

**Deferred (not yet implemented):**
- Real authentication system (owner tokens only, candidate #12)
- Vendor/ops auth beyond owner tokens
- Automatic WhatsApp Business API delivery
- KDS fee reminder UI (flag only)
- Offline KDS queue and chime (PWA baseline shipped, queue deferred)

**Known limitations:**
- No real authentication (owner tokens are capability tokens, not sessions)
- Manual MoMo relies on honor system (customer self-confirms payment)
- Open API payment not yet in production (manual USSD is interim)
- No automatic WhatsApp delivery (manual handoff only)
- KDS fee reminder UI not implemented (flag only)
- Offline KDS queue not implemented (PWA baseline shipped)
- Commission inactive until Open API production cutover

**Important architectural decisions:**
- Store seam is single data path (in-memory + Prisma adapters)
- Browser never imports Store (server-only)
- Owner tokens are per-vendor capability tokens (cached by slug, never typed)
- KDS uses scoped .kds-dark CSS remap for dark theme
- DESIGN.md is single source of truth for UI tokens
- Commission freezes fee at payment time (order-level snapshot)
- KDS SSE self-closes at 250s with client reconnect backoff
- KDS orders are status-gated (PAID/DISPATCHED/COMPLETED only)
- Manual MoMo uses 10-minute payment window
- Menu intake uses private Blob storage (separate from public menu media)
- Private briefing uses recipient-specific access grants with 4-digit PIN
- KDS translations are Ops-controlled (en/rw/fr/sw availability)
- Vendor updates are automatic public catalog feed with engagement tracking

**Currently active integrations:**
- Supabase PostgreSQL (production database)
- Vercel Blob (menu media + private intake storage)
- Vercel (hosting platform)
- MTN MoMo (manual USSD in production, Open API implemented locally)
- Vitest (test runner)
- Prisma (ORM)
- Next.js (framework)
- React (UI library)
- TypeScript (type system)
- Tailwind CSS (styling)
- GSAP (animation library)
- Three.js (3D graphics for marketing hero)

**Future work explicitly mentioned by the repository:**
- Candidate #11: Open API production cutover (awaiting owner approval for Test B)
- Candidate #12: Real authentication system (vendor/ops auth beyond owner tokens)
- KDS fee reminder UI implementation
- Offline KDS queue and chime
- Automatic WhatsApp Business API delivery
- Native partner footage for scroll-world (still crossfade preview is interim)

## Operational notes (read before DB / deploy work — avoid known mistakes)

### Data layer architecture (do not violate)
- The **Store** is the single server-only data seam (`lib/store/`): one interface, two adapters — in-memory (`lib/store/in-memory.ts`, tests/dev) and Prisma/Postgres (`lib/store/prisma.ts`, prod). The browser never imports the Store; client mutates via Server Actions (`lib/actions/`), RSC reads it directly.
- The factory `getStore()` returns the Prisma adapter when `DATABASE_URL` is set, in-memory otherwise.
- **Do NOT add a competing data path.** Auth/RLS via `@supabase/ssr` or `@supabase/server` is deliberately deferred; when auth is added it gets its own `/grill-with-docs` + PRD. Don't wire Supabase client SDKs ad hoc.

### Local DB verification (how to run the Prisma path)
- Credentials live in `.env` (gitignored): `DATABASE_URL` (Supabase pooled, 6543, `pgbouncer=true`), `DIRECT_URL` (session pooler, 5432, for migrations), `TEST_DATABASE_URL` (= DIRECT_URL + `?schema=zantap_test`, isolated test schema).
- Prisma CLI auto-loads `.env`. **vitest does NOT** — `vitest.config.ts` loads it via `loadEnv` and sets `hookTimeout: 90000` / `testTimeout: 30000` because the remote DB suite is slow (~155s). Keep those timeouts.
- **#prisma suite opt-in:** `SKIP_PRISMA_TESTS=1` (default in `.env.example`) skips the remote Prisma contract tests. The suite reseeds before every case (~100 network round-trips) and can stall when Supabase Free egress is saturated or two test processes hit the same schema. Opt in: `SKIP_PRISMA_TESTS=0 npm test`.
- Verify: `npm run db:deploy` → `npm run db:seed` → `npm test`. The Prisma contract suite auto-skips when `TEST_DATABASE_URL` is unset or `SKIP_PRISMA_TESTS=1`.

### Deploy gotcha (RESOLVED 2026-06-23)
- Vercel **Production** env originally had only `POSTGRES_*` names (from the Supabase integration), while the app reads `DATABASE_URL`/`DIRECT_URL`. This is now fixed: `DATABASE_URL` and `DIRECT_URL` are set in Production (confirmed via `vercel env ls production`), so the deployed app connects through the Prisma adapter and reads/writes persist. Leave this note as resolved — do **not** re-theorize prod DB failures as a missing env var without re-checking `vercel env ls`.

### Lessons learned (read before debugging prod / touching server actions)
- **`"use server"` files export ONLY async server actions.** Never `export type`, re-export, or export a non-async value from `lib/actions/*`. Next.js registers every export as a server reference; a type re-export compiles to an **undefined runtime identifier in the production build** → `ReferenceError` on module load → **every** action in that file 500s. Import types from their source module (e.g. `@/lib/kds/types`) instead. (Root cause of known-issue 0002.)
- **Dev-green ≠ prod-green.** Turbopack dev tolerates things that `next build` / the production runtime reject (the above bug reproduced only in prod). After editing a `"use server"` file or anything bundler-sensitive, run `npm run build` before trusting it — a passing dev server is not proof.
- **Diagnose prod failures with prod evidence first.** For a production-only error, pull the real message before theorizing about infrastructure: `vercel ls` → copy the Production deployment URL → `vercel logs <url>`, or use the Vercel MCP `get_runtime_logs` when the integration is scoped to this project. One log line (`ReferenceError: KdsSnapshot is not defined`) ended a long, wrong pgbouncer/DB hypothesis here.
- **KDS order visibility is status-gated.** Only `PAID`/`DISPATCHED`/`COMPLETED` orders reach the kitchen; a `PENDING` order exists between the customer tapping "Pay" and authorizing the MoMo PIN. Never render a payment badge ("PAID via MoMo") independent of `order.status`, and filter the KDS read seam (`fetchKdsSnapshot`), not just the UI.
- **Keep these operational notes current.** A stale "not yet resolved" note above contributed to a wrong first hypothesis. When reality changes, update the note in the same session.

### Tooling notes (host = Windows PowerShell; known command gotchas + manual fallbacks)
When a command errors, the agent should stop, report the failure + cause, and suggest a manual
path rather than retrying blindly (saves tokens). Recurring gotchas seen on this machine:
- **Vercel MCP is scoped to the wrong project.** `get_runtime_logs` / `list_projects` via the
  Vercel MCP return only project `digsol` and **403 Forbidden** for `zantap`. Until the MCP
  connection's project access includes `zantap` (re-authorize the Vercel MCP and pick "All
  Projects", or add `zantap` under Vercel → team → Authorized Apps/Integrations), use the
  authenticated CLI instead: `npx vercel logs <prod-url> --json`. You (the human) fix the scope
  in the Vercel dashboard; the agent cannot.
- **PowerShell, not bash.** `&&` is not a statement separator (use `;` or chain with
  `-and`/separate calls). Heredocs (`$(cat <<'EOF')`) do **not** work — write the text to a temp
  file and use `git commit -F <file>`. `Select-String -SimpleMatch` treats regex metachars
  literally (e.g. `data: \{` won't match `data: {`); drop `-SimpleMatch` for regex.
- **Headless prod Server Action calls are unreliable.** Driving `placeOrder` over HTTP with a
  `Next-Action: <id>` header fails with `X-Nextjs-Action-Not-Found` because the deployed build's
  action ID differs from the local `.next` manifest. For a real customer→KDS prod smoke, drive the
  browser UI (two tabs) — the agent can capture timing with a streaming `curl` against
  `/api/vendor/<slug>/kds-stream` while the human taps Pay (MoMo sim PIN `12345`).
- **SSE prod check.** `curl.exe -s -N --max-time <sec> <kds-stream-url>` holds the stream; a clean
  exit 0 around ~250s is the self-close working (not a kill). The 250s server timer can also fire
  earlier on a transient poll error via the same idempotent `teardown()` — still a clean close.

### Security
- The Supabase DB password was exposed in chat once and should be rotated (Settings → Database → Reset password), then update `.env` and the Vercel synced var.

### Status
- Store seam (Prisma + in-memory) fully implemented and verified (contract tests green against real Supabase Postgres)
- Manual & simulate MoMo checkout shipped. Open API Collection + Vendor payout implemented locally (Slices 1-3 complete) — awaiting owner approval for Test B and production cutover (ADR-0096, ADR-0097)
- Known-issue 0002 fixed & deployed 2026-06-23: KDS action buttons 500 in prod (a `"use server"` type re-export) and orders showing "PAID via MoMo" before payment
- Known-issue 0002 Symptom C fixed & deployed 2026-06-23: KDS SSE stream self-close at 250s with client reconnect backoff (ADR-0004)
- KDS Vendor Suite (menu CRUD, media gallery, history filters, export/receipts, onboarding guides) deployed 2026-06-23
- KDS workflow UI (kitchen stages, bulk actions, dispatch modal) deployed 2026-06-24 (ADR-0013, ADR-0014)
- KDS Orders + delivery slip migrated to DESIGN.md tokens, dead `zk-*` palette removed 2026-06-24
- KDS dark operational theme restored 2026-06-27 (ADR-0017)
- Storefront menu image carousel shipped 2026-06-27 (ADR-0018)
- Vendor onboarding (gate-free wizard with owner token, phone-based recovery) deployed 2026-06-30 (ADR-0020, ADR-0021, ADR-0022, ADR-0024, ADR-0025)
- Pooler egress hotfix 2026-07-01: KDS SSE revision-first poll to reduce Supabase Free egress (ADR-0023)
- KDS order pagination with realtime boundary deployed 2026-08-20 (ADR-0062)
- PWA baseline (manifests, install hints, offline fallback) deployed 2026-08-15 (ADR-0051, ADR-0059)
- Marketing funnel (cinematic hero, scroll-world preview, durable lead capture) deployed 2026-08-06 (ADR-0049, ADR-0050)
- Multi-recipient lead routing deployed 2026-08-12 (ADR-0053)
- Vendor menu intake (self-build/assisted, private storage, Ops review/import) deployed 2026-08-30 (ADR-0082)
- Private briefing (recipient-specific access grants, viewing sessions) deployed 2026-09-01 (ADR-0072)
- KDS translations (en/rw/fr/sw with Ops-controlled availability) deployed 2026-09-22 (ADR-0089, ADR-0094, ADR-0095)
- KDS readiness guide (replayable onboarding education) deployed 2026-09-22 (ADR-0083)
- Stock tracking (dish-level stock count, low-stock thresholds) implemented
- Profit insights (expenses, period profit, cost prices) implemented
- Add-ons (item-specific add-on groups, server-priced snapshots) implemented (ADR-0071)
- Size options (dynamic menu size options) implemented (ADR-0069)
- Vendor updates (automatic public catalog feed) implemented (ADR-0062, ADR-0063, ADR-0068)
- Restaurant hub (PWA install, saved restaurants, updates) implemented (ADR-0064, ADR-0066)
- Commission settings (global + per-Vendor, fee snapshot) implemented but inactive until Open API production cutover (ADR-0096, ADR-0097)
- Candidate #29 (international lead phones) deployed 2026-09-18 (ADR-0093)
- All retired secrets removed from code: `PROVISION_SECRET`, `VENDOR_WRITE_SECRET` — replaced by per-vendor owner tokens
- **Candidate #16 Issue 4 done 2026-07-01 — candidate #16 now FEATURE-COMPLETE** (still branch `feat/onboarding-redesign`, not deployed). Post-launch OPTIONAL "keep improving your storefront" checklist wired into the KDS Setup drawer. New pure module `lib/vendor/optional-checklist.ts` (`OPTIONAL_CHECKLIST_ITEMS` = 9 rows in mockup order + `deriveOptionalChecklist(vendor, menu)` + `countOptionalCompleted`). `SetupDrawer` gains (a) the checklist section ("X of 4 completed" — the counter reflects **actionable rows only**; the 5 deferred rows render disabled with a "Soon" badge) and (b) Logo URL / Cover image URL inputs + a Business Description textarea in the profile editor. `updateVendorProfile` now forwards `logoUrl`/`coverImageUrl`/`description` (schema fields already existed since Issue 1 — trim → undefined; still a single async `"use server"` export). `KdsDashboard` seeds those three from `vendor.*`, passes the new required `menu` prop, and round-trips them via `onProfileSaved` so the checklist ticks after save. **Actionable** = Logo, Cover, Menu Photos (existing MenuImage gallery), Business Description. **Deferred `comingSoon`** (no schema, no editor this pass) = Business Hours, Ingredients, Delivery Zones, Estimated Prep Time, Social Links. Owner-token guarded via `useOwnerToken` (never prompts). Deliberate deviation from the mockup's literal "0 of 8": count only completable items so 100% is reachable (ADR-0026). No new schema/migration, no Blob upload action, no wizard/server-signature change. 6 new unit tests (`lib/vendor/__tests__/optional-checklist.test.ts`); `npm run build` clean; `npm test` **180 passed / 64 skipped**. **Next: build → deploy → prod smoke** for the whole candidate #16 — prod cutover = remove `PROVISION_SECRET` from Vercel, leave `PROVISION_KILL_SWITCH` unset, `VENDOR_WRITE_SECRET` already dead.
- **Candidate #16 DEPLOYED 2026-07-01** (`26ef33d` → `dpl_J2iPHqJ1u2g1iW8pXf3k8oCSwWwX` → alias `zantap-psi.vercel.app`). Issue 4 committed (`26ef33d`); branch `feat/onboarding-redesign` is 3 commits ahead of `origin/main` (Issues 2/3/4), 0 behind — cleanly on the pooler hotfix. Local `npm run build` clean + `npm test` 180/64; Vercel remote build clean. **Prod cutover DONE**: `PROVISION_SECRET` and `VENDOR_WRITE_SECRET` **removed** from Production (`vercel env rm … production --yes`); `PROVISION_KILL_SWITCH` left **unset** (signup open); migration `20260701150531_onboarding_redesign_vendor_fields` confirmed applied (`prisma migrate status` → "up to date"). **Curl smoke PASS**: `/onboard` 200 with `kds-dark` + "Get Started" + "Recover access", provision gate strings gone; `/onboard?recover=1` 200; storefront `/inka-steakhouse` 200 (no `kds-dark`) + KDS `/vendor/inka-steakhouse` 200 (`kds-dark`); Issue 4 bundle ships checklist strings ("Keep improving", "Logo", "Cover image", "Soon"); KDS SSE stream live (held 12s, healthy snapshot). No secret was shared in chat this session (nothing to rotate; owner tokens are per-vendor, minted at provision, never shared). **STILL PENDING — human two-tab interactive walkthrough** (headless Server Action calls are unreliable, X-Nextjs-Action-Not-Found): run the wizard → Go Live (provision new vendor) → You're Live QR + owner-token auto-cache → open KDS Setup → optional checklist "X of 4" + Soon badges → set Logo/Cover/Description + save (owner-token guarded, no prompt) → checklist ticks → MoMo sim PIN `12345` → PAID on KDS; and `/onboard?recover=1` (slug + signup phone → re-issues token). On human PASS, flip #16 to ✅ DONE · deployed · prod-smoked in this file + `.scratch/architecture-candidates.md`.
- **Candidate #16 dark-wizard light-render fix + redeploy 2026-07-01** (`c5a7048` → `dpl_Gc27AbbG7dCA11HAzAaPurBjHcCZ` → `zantap-psi.vercel.app`, supersedes `dpl_J2iP…`). Symptom: the `/onboard` splash rendered on the **light** editorial canvas with only the role cards/CTA dark. Root cause: the `.kds-dark` token remap in `globals.css` uses a **descendant** combinator (`.kds-dark .bg-canvas`), so it never recolors an element that carries BOTH `.kds-dark` and the token on the **same node** — and the wizard root is `<div class="kds-dark bg-canvas">` (child cards are real descendants, hence dark; the root stayed light `#f5f5f5`). KDS only "got away with it" because its inner `max-w-kds` div also carries `bg-canvas` (a descendant) that fills the screen. Fix = paint the `.kds-dark` root itself (`background-color:#0e0e10; color:#f4f4f3`) so the dark surface covers the full viewport regardless of where the token sits (also fixes any KDS ultrawide light margin). Verified: deployed CSS contains `.kds-dark{…color:#f4f4f3;background-color:#0e0e10}`. **Lesson: `.kds-dark` recolors DESCENDANTS only — put the token on a child, or rely on the root paint; never assume `class="kds-dark bg-canvas"` on one node goes dark.**
- **Candidate #16 brand + KDS polish shipped 2026-07-01** (branch `feat/onboarding-redesign`, TWO prod deploys; ADR-0027). (1) **Brand pass** `09943b0` → `dpl_3LK5RHZdDKLdfU6wBe3YWf15v8Ga`: real ZanTap logo (full-colour medallion) + illustrated role icons replace the emoji on the onboarding splash, the "You're Live" hero, and the **KDS dashboard header** (`MetricsBanner`), plus a **round + transparent favicon** (`app/favicon.ico`+`icon.png`+`apple-icon.png`). Assets alpha-trimmed + downscaled into **`public/brand/`** (source art filled only ~14–19% of its canvas → the first attempt rendered tiny; trimming to the opaque bbox fixed it). First `next/image` use in the repo; SVG avoided so no `next.config`/`dangerouslyAllowSVG`. (2) **KDS polish** `aa9d1d1` → `dpl_GBVsWAaQXukhbsVengzHFo9hbFF5` (**current live alias**): new `.kds-surface` class = slightly darker `#0b0b0d` + subtle SVG `feTurbulence` film grain baked into a `background-image` (scoped to the KDS, onboarding unaffected); the SSE **"Reconnecting…" indicator** reduced to a compact centered chip with a spinning loader ring (dropped the "updates paused — queue may be stale" line). Both build + lint green; prod curl `200`; `/brand/*`, `/icon.png`, `/favicon.ico` and the `kds-surface` class all confirmed live. No secret shared this session.
- **Candidate #16 ✅ DONE · deployed · prod-smoked 2026-07-02.** Interactive prod walkthrough completed: a Playwright real-browser harness (`.scratch/onboarding-redesign/prod-two-tab-smoke.mjs`, screenshots in `smoke-shots/`) drove `/onboard` → Go Live on prod (vendor `abc` persisted in DB `vzhauguzvhdlpwvqhsfo` with `businessCategory`, `payoutMethod`, hashed owner token), owner token auto-cached (32 chars, no secret typed), KDS Setup optional checklist "0 of 4" + 5 "Soon" badges, device-unlocked chip, and profile save with NO prompt — Logo/Cover/Description confirmed persisted in the prod DB. The human then verified the remaining interactive steps (MoMo PIN `12345` → PAID on KDS; `/onboard?recover=1` token re-issue) and confirmed PASS. Prod DB also gained a real organic vendor `lilys` (created via the live wizard 2026-07-01, 1 dispatched order) — the self-serve funnel works end-to-end in the wild. Harness gotchas for reuse: role-icon `src` is Next-image-encoded (`brand%2Froles`); blur `#biz-name` before filling `#biz-slug` (auto-derive overwrites it); a coachmark overlay can intercept the Save click (`force: true`). **Merged to `main` 2026-07-02** (fast-forward `8fc1e11..2b1c098`, pushed). The push auto-triggered a Vercel prod deploy of the identical merged code (`dpl_5dzRyX7KCz9GrmfKoW8P4fuEwPqX`), which now holds alias `zantap-psi.vercel.app` (supersedes `dpl_GBVsWAaQ…` — same code, no behavior change); post-merge curl smoke: `/onboard`, storefront, KDS all 200.
- **Candidate #9 ✅ DONE · deployed · prod-smoked 2026-07-02** (`5f56269` → `dpl_EcGsGd4WNbRtgPKLUK9mcnaHMcK5` → alias `zantap-psi.vercel.app`): KDS **"Notify vendor on WhatsApp"** on expanded PAID tickets (pre-dispatch) via `buildVendorWhatsAppUrl` + Rwanda E.164 (`0788123456` → `250788123456`); dispatch modal phoneless `wa.me/?text=` unchanged. ADR-0028. Playwright prod smoke 8/8 PASS (`.scratch/vendor-whatsapp-paid-notification/prod-smoke.mjs`): MoMo PIN `12345` → PAID on `/vendor/inka-steakhouse` → expand ticket → `wa.me/250788123456` + `/slip/{id}` in text → dispatch modal still opens phoneless delivery-slip share. Curl: KDS bundle contains CTA string. `npm test` 188/64; remote build clean.
- **Candidate #19 ✅ DONE · deployed · prod-smoked 2026-07-02** (`31c33c7` → `dpl_Aq8HQ3Hivdm3r1txwmKSLG2ygkUP` → alias `zantap-psi.vercel.app`): KDS + Storefront polish batch (Issues 01–11) — E.164 recovery matching, dashboard Live/Off + Kigali gross delta, storefront branding render, menu image fit, Blob branding upload, shared Select/Combobox, help modal + peek FAB, history chips + dark receipt, onboarding polish, preview Back chip, success Back to menu, `lib/base-url.ts` seam. ADR-0029–0032. **`NEXT_PUBLIC_BASE_URL=https://zantap.ai`** added to Vercel Production (redeploy required for public env). Playwright prod smoke **15/15 PASS** (`.scratch/kds-storefront-polish/prod-smoke.mjs`): recovery `+250788123456` → inka, Live label + real gross delta, help → `wa.me/250784928786` with `zantap.ai` storefront URL, preview `?from=kds` + Back chip, MoMo PIN `12345` → success + Back to menu, Hero `tel:` call button. `npm test` 203/66; remote build clean.
- **Candidate #20 ✅ DONE · deployed · prod-smoked 2026-07-05** (`712101d` → `dpl_8zVJC98E2oEs7Du8eHKx5sTta8C5` → alias `zantap-psi.vercel.app`): Manual MTN MoMo USSD checkout (interim pre-API) — `MOMO_MODE` prod default `manual`, `ManualMomoSheet` dial/awaiting/confirm, `OrderStatus.CANCELLED`, Store `confirmManualPayment`/`abandonManualPayment`, 10-min payment window. Migration `20260705120000_order_status_cancelled` applied; prod `inka-steakhouse` `momoCode` `INKA001` → `880001`. ADR-0033. Playwright prod smoke **9/9 PASS** (`.scratch/manual-momo-ussd/prod-smoke.mjs`): Pay → Open MoMo → USSD `*182*8*1*880001*{amount}#` → I've paid → KDS ticket; Didn't pay → History `CANCELLED`; countdown label present. `MOMO_MODE` left unset in Production.
- **Mobile UX polish ✅ DONE · deployed · prod-smoked 2026-07-05** (`bac91e7` → `dpl_AwjU54mUH8ddzMTvgVPj7zeZ7R35` → alias `zantap-psi.vercel.app`): TopBar `?from=kds` Back nav, Modal portal `z-[70]` + drag handle, Menu Variation 3 list + edit modal redesign, onboarding photo preview, local blob fallback, HelpModal scroll/collapsed sections. Playwright mobile smoke **16/16 PASS** (`.scratch/mobile-ux-polish/prod-smoke.mjs`, 390×844): preview Back chip, help scroll + stacking (`y=42`), menu description typing stable (owner-token recovery), edit modal not under header.
- **Candidate #21 ✅ DONE · deployed · prod-smoked 2026-07-05** (`5ad7a92` → `dpl_GnTnvoBZ992DVGBu7cbtCKfKFdRS` → alias `zantap-psi.vercel.app`): Storefront customize slim-down (images + special-instructions notes); notes persist cart → `OrderItem.notes` → KDS italic line (ADR-0036); MoMo payout phone normalization (ADR-0034); KDS Setup business/payments/slug edit with owner-token guard + slug collision check (ADR-0037). Migration `20260705140000_order_item_notes` applied pre-deploy. Hotfix: `updateVendorProfile` uses `canonicalizePhone` (fixes `+250 07…` double-zero on Setup save). Playwright prod smoke **16/16 PASS** (`.scratch/candidate-21/prod-smoke.mjs`): customize note → manual MoMo I've paid → KDS ticket note; Setup Save business/payments; USSD `*182*8*1*880001*`; slug rename to `inka-steakhouse-smoke` → redirect + old URL 404 → revert; taken slug blocked. `npm test` 242/73; prod `inka-steakhouse` phone restored to `250788123456` after smoke.
- **Candidate #17 ✅ DONE · deployed · prod-smoked 2026-07-06** (`0c44d41` → `dpl_8R8L4Mq42qvT1rTVSXoTwv4oqhLm` → alias `zantap-psi.vercel.app`): Operator console — Control API `/api/operator/v1/*`, Ops UI `/ops`, halting controls (suspended storefront, blocked checkout, KDS banner), vendor directory, recovery inbox, detail tabs, token revoke/reissue, audit log. Migration `20260706180000_operator_console` applied; Production env `OPERATOR_API_KEY` + `OPERATOR_UI_SECRET` + `ZANTAP_OPERATOR_API_URL` (same-origin alias). ADR-0039. Playwright prod smoke **4/4 PASS** (`.scratch/operator-console/prod-smoke.mjs`, desktop + mobile). Halting curl smoke: suspend/reactivate `inka-steakhouse` — suspended page + KDS banner → storefront restored. **Prod cutover note:** co-located Ops server-fetch must not use `NEXT_PUBLIC_BASE_URL` (`zantap.ai` unmapped) or per-deployment `VERCEL_URL` (SSO 302); set `ZANTAP_OPERATOR_API_URL=https://zantap-psi.vercel.app/api/operator/v1` until custom domain live. (Superseded 2026-08-06: `zantap.app` is live; both env vars now point at it — see the domain-cutover status entry.)
- **Candidate #22 ✅ DONE · deployed · prod-smoked 2026-07-06** (`e734387` → live via alias `zantap-psi.vercel.app`, no separate deploy — shipped before #17). Storefront Hero share + menu image lightbox; KDS Drivers tab CRUD; `Order.driverId` assign (READY stays READY, call-only, bulk one-driver); setup drawer auto-open cap 2×. Migration `20260705180000_order_driver_assignment` applied. ADR-0038. Playwright prod smoke **22/22 PASS** (`.scratch/candidate-22/prod-smoke.mjs`): share copies `zantap.ai` URL, lightbox, drivers edit, pay→READY→bulk assign (2 orders) + single assign `tel:`, no WhatsApp in assign modal, setup cap ≤2×.
- **Candidate #10 ✅ DONE · deployed · curl-smoked 2026-07-07** (`9473ccc` → `dpl_B9zuaxYf72mgJGPbJ4vXJ6LDAWZy` → alias `zantap-psi.vercel.app`): Customer storefront → ElevenLabs `DESIGN.md` — Issues 01–04 (shell/hero/topbar, menu cards/chips/carousel, checkout/MoMo/cart/success, customize sheet). All customer `zt-*` palette retired; only `zt-hidescroll` scroll utility remains. KDS `.kds-dark` unchanged. ADR-0041. Prod curl `/inka-steakhouse`: HTTP 200, zero `zt-brown`/`zt-warm`/`zt-accent`/`kds-dark`, `bg-canvas`/`surface-card`/`border-hairline` present. Remote build 53s clean. No Playwright harness (optional human gesture smoke on customize sheet).
- **ADR-0042 dead `zt-*` Tailwind palette removal ✅ DONE · deployed · curl-smoked 2026-07-07** (`8117fe5` → `dpl_6wacM85XfVdhDXYenhRmHyrYuLGg` → alias `zantap-psi.vercel.app`): Removed deprecated `zt` color block + unused `ztfloat`/`ztspin`/`ztshim`/`ztpulse` animations from `tailwind.config.ts`; `Orbs.tsx` → `animate-brandfloat`. Kept `zt-hidescroll` + confetti CSS. Prod curl `/inka-steakhouse`: HTTP 200, zero palette classes, `bg-canvas`/`surface-card` present. Remote build 51s clean.
- **ADR-0042 follow-up (Orbs delete + dead blush shadows) ✅ DONE · deployed · curl-smoked 2026-07-07** (`d7717f6` → `dpl_6wTYHiCYoP27GRLEg9mgKSfcTfbK` → alias `zantap-psi.vercel.app`): Deleted unused `components/ui/Orbs.tsx`; removed dead `glass`/`glass-lg`/`cart` box shadows from `tailwind.config.ts` (zero references). Prod curl `/inka-steakhouse`: HTTP 200, zero `zt-*`/`kds-dark`, `bg-canvas`/`surface-card`/`border-hairline` present. Remote build 51s clean.
- **Restructure Issue 01 (Z brand rollout) ✅ IMPLEMENTED 2026-08-05** (branch `product/restructure-audit`, working tree — NOT yet committed/deployed; ADR-0048 supersedes ADR-0027's medallion choices). All four medallion usages (`SplashStep` 56px, `LiveStep` hero 96px, KDS `MetricsBanner` 40px, `OpsShell` 32px) → `public/brand/approved-z/`; favicon set rebuilt from `zantap-z-favicon-{32,64,180,512}` (`app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` packed as PNG-in-ICO via `.scratch/product-restructure/build-favicon-ico.mjs`); medallion retired to `public/brand/proofs/rejected/zantap-logo-medallion.png` (`zantap-logo-2.png` KEPT — Z identity source for proofs docs). **Variant rule (ADR-0048): dark `.kds-dark` surfaces use the off-white avatar tile with rounded-SQUARE corners** (transparent mark is 85% near-black → invisible on dark; a circular crop clips the Z's corner — never `rounded-full`); light ops sidebar uses the transparent full-colour mark. Build + lint green; local Playwright visual check PASS (`.scratch/product-restructure/issue-01-shots/`: splash, KDS header, storefront, icon routes 200). "You're Live" hero + ops sidebar code-verified only (need provisioning/ops auth to render). Next: commit + deploy with subsequent Track 1 work; issue 02 (`zantap.app` cutover) stays owner-blocked; issue 03 (landing) is next implementable.
- **Restructure Issue 03 (marketing page at `/`) ✅ CORE SHIPPED · DEPLOYED · PROD-SMOKED 2026-08-06** (ADR-0049; `fe9f5d1` merged to `main` ff `4f64b5f..fe9f5d1` — also carries Issue 01 brand `877cef0` + Issue 02 sweep `2479b19` → auto Vercel Production `zantap-qv9d8y90w` → `zantap.app`; prod smoke: `/` 200 funnel HTML incl. hero/OG/kitchen screen, robots+sitemap correct, storefront/KDS/onboard 200, Z favicon + brand assets + hero mp4 200; `.scratch/lead-funnel-prototype/` deleted per NOTES): root demo redirect replaced with the production funnel — C structure (offer + visible lead form + sticky mobile CTA conversion guard) + A cinematic Kigali hero (`public/marketing/` still + 5s loop; video gated by reduced-motion/Save-Data via `useSyncExternalStore`); GSAP ScrollTrigger reveals (`MarketingMotion`, matchMedia-gated) + lazy Three.js orbit accent (`OrbitAccent`); i18n-ready copy in `lib/marketing/copy.ts`; lead form built against Issue-04's `SubmitLeadInput` (`lib/leads/types.ts`) with **interim WhatsApp transport** to the owner support number — Issue 04 swaps `deliverLead` for the durable server action; SEO = metadata/OG + `app/sitemap.ts` + `app/robots.ts` (storefronts crawlable; `/api/`,`/ops`,`/vendor/`,`/slip/` disallowed); `RESERVED_VENDOR_SLUGS` (`lib/vendor/slug.ts`) enforced in BOTH Store adapters' `isSlugAvailable` + tests. Fresh Z-brand KDS screenshot captured against the in-memory store (`issue-03-capture-kds.mjs`) — the July `public/brand/UI-screens/` captures show the retired medallion + `zantap.ai`; never reuse them on marketing surfaces. Lint + build clean; `npm test` 256/78. **Scroll-world cinematic NOT shipped** — blocked on the skill's owner interview + budget approval (ADR-0047 decision 3); interview issued to owner, answers to be recorded in `.scratch/product-restructure/issue-03.md`. Issue 01 (Z brand) was already committed as `877cef0` on this branch and deploys together with Issue 03.
- **Restructure Issue 02 (`zantap.app` cutover) ✅ DONE · prod-smoked 2026-08-06.** Owner bought `zantap.app` and attached it in Vercel: apex `zantap.app` = Production, `www.zantap.app` → 308 redirect to apex, `zantap-psi.vercel.app` alias retained. Production env updated via CLI: `NEXT_PUBLIC_BASE_URL=https://zantap.app`, `ZANTAP_OPERATOR_API_URL=https://zantap.app/api/operator/v1`. Prod rebuilt with `vercel redeploy dpl_CSVEC8L2zu7nRqeQc4tN65PpHxCc` → `zantap-bexc31rf4` → aliased `zantap.app` (deliberately NOT `vercel --prod` from the local tree, which held uncommitted Issue 01 work). Smoke: root 307→`/inka-steakhouse`; storefront, KDS, `/onboard` all 200 over `zantap.app`; `www` 308→apex; `zantap.app` confirmed inlined in a deployed `/_next/static/chunks/*.js` (public env baked at build). `zantap.ai` swept from live artifacts (`lib/base-url.ts` comments, `lib/__tests__/base-url.test.ts` fixtures — 7/7 green, `.env.example`, ADR-0032 consequence line, the stale ops-API note above); dated historical log entries left as history. QR/printed material is now unblocked on the real domain.
- **Scroll-world ZERO-CREDIT preview built & QA'd 2026-08-09** (ADR-0052; UNCOMMITTED on `main`, not deployed; zero Higgsfield spend, balance stays 881.42): desktop legs 1–3 encoded per pipeline §5 → `public/marketing/vid/`; webp posters + real "MoMo from MTN" logo → `public/marketing/scroll/`; scrub engine adapted as a mid-page sticky embed (`components/marketing/scroll-world/`) mounted on `/` between `#how` and the offer flow — scenes 1–3 scrub video, 4–6 still-crossfade; real MoMo logo + ZanTap screens in the HTML overlay (never in video); finale CTA → `#lead-form`; Save-Data ≡ reduced-motion. QA 13/13 (`.scratch/product-restructure/scroll-world/preview-qa.mjs`); lint/build clean, tests 266/80. Gotchas in ADR-0052: engine CSS must be injected UNLAYERED (Tailwind preflight beats any `@layer` rule) and desktop copy centering must ride inside the per-frame transform. Owner now picks: finish AI chain vs shoot real walkthrough footage (engine scrubs any mp4). Same-day owner review: approved except AI-invented device UIs; **credit balance corrected to ~112–120** (stale 881.42 above; video re-renders unaffordable → real-footage finish favored); scene-3 still-crossfade swap APPROVED for next session (zero credits, `still_momo` poster, drop momo clip); owner tests locally before any deploy; ask before ANY generation, even stills.
- **Scroll-world scene-3 still-crossfade swap ✅ DONE 2026-08-09 (later session, zero credits)** — the owner-approved swap executed exactly: `momo` dropped from `clips` in `components/marketing/scroll-world/ScrollWorldSection.tsx` (scene 3 now still-crossfades like 4–6; rejected `leg_momo` encode left unused at `public/marketing/vid/momo.mp4`, re-slots when the film is finished); poster `public/marketing/scroll/momo.webp` rebuilt from the approved clean `still_momo.png` (ffmpeg scale=1600:-2 q82). QA `preview-qa.mjs` re-run **13/13 PASS** (blob/scrub now covers 2 clips; scene-3 shot = clean amber phone + real MoMo badge; seam 2→3 composition crossfade acceptable per plan); lint/build clean, tests 266/80. ADR-0052 amended. Still UNCOMMITTED on `main`, NOT deployed — owner scrolls the preview locally (`npm run dev` → localhost:3000, section after "What happens next") and then decides: real-footage finish (favored at ~112–120 credits) and whether/when the preview commits + deploys. NO generations of any kind without asking the owner first.
- **Scroll-world approved wordmark + mobile hardening ✅ DONE LOCAL 2026-08-09 (Codex completed Cursor-interrupted checklist; zero credits)** — audit found Cursor had generated only `public/brand/approved-z/zantap-wordmark-logo2-darkbg.png` + proof via `build-wordmark-dark.mjs`; remaining work completed: real off-white/amber wordmark wired into marketing masthead/footer (CSS inversion removed); engine uses stable `100svh`/`100vh` fallback with JS measuring the rendered viewport, ignores URL-bar-only relayouts, schedules passive touchmove/touchend reads, and uses faster coalesced seek catch-up; `viewport-fit=cover`; mobile hint moved away from the CTA; `StickyCta` lifted into isolated GPU-backed z-80 layer after a captured compositor text-paint loss. QA expanded to **19/19 PASS** (desktop, reduced-motion, touch-enabled 390×844 portrait, 844×390 rotation; stable track math, fast-flick seek settling, copy/CTA bounds, zero overflow/errors); lint/build clean, tests 266/80, diff check clean except CRLF warnings. ADR-0052 amended. Still UNCOMMITTED/NOT DEPLOYED; no Higgsfield/Monid/image generation. Native 9:16 footage remains separate; explicit owner approval is required before commit/deploy or any generation.
- **Scroll-world Option B chosen 2026-08-09 — native-footage pre-production planned, zero credits.** Owner explicitly chose to keep the complete preview local and finish with real partner-restaurant footage. Plan: `.scratch/product-restructure/scroll-world/native-walkthrough-footage-plan.md` — separate continuous 16:9 + native 9:16 masters, six frame-adjacent Architecture A clips, 4K/25 fps 1/50 capture, permissions/PII controls, 1080p/720p encodes, later `clipMobile`/`stillMobile` engine wiring, and expanded Step 8 QA. Existing ~112–120 Higgsfield credits remain untouched; no generation, commit, or deployment was authorized. Next gate is location/permission + capture logistics; footage integration and commit/deploy remain separate owner approvals. ADR-0052 amended.
- **Restructure Issue 04 (durable lead capture) ✅ DONE · DEPLOYED · PROD-SMOKED 2026-08-09** (ADR-0050). Owner approved after audit; `2d6e391` cherry-picked onto main as `c79738e` (conflict-free) → pushed → auto Vercel Production `zantap-lxwwvr7vs` → `zantap.app`. Validation on replay: lint clean, 266 passed / 80 skipped, build green. Prod smoke PASS: live form submit (playwright-core msedge, `.scratch/product-restructure/lead-capture-prod-smoke.mjs`) → action POST 200 → success state → `Lead` row verified in prod DB (canonical `250788123456`, NEW, marketing-root; labeled smoke row left). Migration `20260806213500_durable_lead_capture` was already applied. Marketing form now persists through the Store seam; WhatsApp interim transport retired. Issue 05 (Ops lead inbox) unblocked. Shared continuity file `docs/agents/codex-cursor-shared-handoff.md` updated (session ledger 2026-08-09 Cursor).
- **Restructure Issue 05 multi-recipient WhatsApp routing ✅ DONE · DEPLOYED · PROD-SMOKED · CONFIGURED 2026-08-12** (`5aee9b2` + hydration review fix `943efbc`; ADR-0053). Ops manages multiple independently enabled recipients; every Lead persists first and then receives one immutable, concurrency-safe round-robin assignment through the Store seam. Migration `20260811234500_multi_recipient_lead_routing` is applied. Validation: schema/TypeScript/lint/build green, 284/89 full suite, 97 focused, isolated Postgres Lead contract 11/11 including 12-way concurrency. Production `dpl_C5BBDbY4wiZVypSAvofSz2quRqpX`: labeled persistence-first Lead appeared Unassigned before routing activation, then labeled routed Lead received exactly one CTA and appeared assigned to `…8786`; error/warning runtime scans clean. Review found two recoverable relative-time hydration mismatches; `943efbc` fixes both desktop/mobile nodes and follow-up deployment `dpl_HTWEh9G18kJ9QF5Er9hatqfuTScq` is Ready on `zantap.app`. Final authenticated Ops configuration shows `1 of 2 enabled`: `…8786` enabled and owner-supplied `…7771` disabled. `/ops/leads` loads with zero browser console errors. Full recipient numbers are not retained in continuity.
- **Issue 05 documentation closure 2026-08-12:** `a2e0240` tracks the Codex↔Cursor shared handoff and updates `README.md` + ADR-0053. Production `dpl_7SL44zZwYdYiuR4yRGFJccQjKpEd` is Ready on `zantap.app`; root and Ops login checks passed and initial error/warning scans were empty. This docs-only deploy does not change routing behavior.
- **Scroll-world preview ✅ SHIPPED · DEPLOYED · PROD-SMOKED 2026-08-12** (`3a80e3e` → `dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn` → `zantap.app`; ADR-0052, supersedes the earlier local-only preview notes): `/` now mounts the six-scene mid-page sticky journey; scenes 1–2 scrub accepted desktop clips, scenes 3–6 intentionally crossfade accepted stills, with real MoMo/ZanTap overlays, approved dark wordmark, Save-Data/reduced-motion no-video fallback, stable touch viewport math, and CTA stacking. The engine, active public media, raw/generated masters, prompts, boundary frames, capture plan, QA harness/screenshots, and ADR are tracked; third-party `.json`/`.err` metadata is excluded. The rejected AI-invented MoMo clip is archival only under `.scratch` and `/marketing/vid/momo.mp4` returns 404. Validation: lint clean, full suite 284/89, build green, local and Production Step 8 19/19; public assets 200, video byte-range 206, zero browser errors/overflow, Vercel error/warning scans empty. This is explicitly a desktop-preview stopgap on phones, not the final native film. Real partner footage in separate 16:9 + 9:16 chains remains pending; no generation was re-authorized.
- **Candidate #23 Ops outreach + KDS + marketing batch ◐ IMPLEMENTED 2026-08-13** on Cursor branch `feat/ops-kds-marketing-batch` (shared work; **not committed/deployed**). Grilled decisions → ADRs 0054 (Prospect≠Lead), 0055 (dish-level stock), 0056 (per-vendor feature flags). Issues A–E under `.scratch/ops-kds-marketing-batch/`. Migration `20260813120000_ops_kds_marketing_batch` in-repo, not applied to prod. Includes: Ops Prospects tracker, marketing site settings, KDS Stock/Profit/polish, marketing footer/legal/comparison/CTA/hero, scroll-world eased scrub + soft screenshots, scenes 2–4 shot list. Journey 02/06 attempt 1 was generated exactly once through the Higgsfield connector and owner-accepted 2026-08-14 (job `0a409cd1-425b-4ffd-a5c1-22bb104601a4`, 32.5 credits, balance 93.72); attempt 2 skipped, attempt 3 reserved. The accepted result is baked into Scene 02 on isolated branch `codex/journey-02-walkthrough` as a native 720p audio-free web encode with matching first-frame poster; not committed/deployed. Cursor's lead-form/marketing work is owner-accepted. Journey 03/06 correction was generated exactly once after owner approval using `momo.webp` + `successful-payment.png`, GPT Image 2, 3:2/2K/High: job `3f09077f-13e7-45fd-9d29-31b0b1dd4713`, local output `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`, 7 credits charged, balance 86.72, no retry; owner accepted attempt 1 on 2026-08-14. **Journey 03 INTEGRATED by Cursor 2026-08-14** on `feat/ops-kds-marketing-batch` (HEAD switched from `codex/journey-02-walkthrough` — both point at `f57ccbb`, pointer-only move, full dirty tree preserved): `public/marketing/scroll/momo.webp` rebuilt from the accepted PNG via the batch's poster pipeline (ffmpeg scale=1600:-2, libwebp q82 → 1600×1062, 143 KB); source PNG preserved untouched at `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`; `ScrollWorldSection.tsx` comments updated (scene 3 stays deliberately clip-less — still-crossfade). Verify: scroll-world QA 16/19 (same 3 pre-documented stale assertions as Codex's run: footer wordmark filename, removed MoMo-logo overlay, new sticky-CTA wording — not regressions), scene-3 harness `.scratch/ops-kds-marketing-batch/journey-03-scene-check.mjs` **10/10** desktop 1440×900 + mobile 390×844 (fresh 1600×1062 poster served, payment-success hierarchy reads, crossfade seams to scenes 2/4 healthy, zero overflow/console errors, shots in `journey-03-shots/`), lint clean, build green. Scene 04/06 remains separately gated. Fee machinery deferred.
- **Candidate #23 ✅ DONE · SHIPPED · PROD-SMOKED 2026-08-14** — owner reviewed + approved the full batch; committed as `7d87984` on `feat/ops-kds-marketing-batch` (238 files; the branch sat at `origin/main`, so push was a fast-forward `f57ccbb..7d87984`) → migration `20260813120000_ops_kds_marketing_batch` applied via `npm run db:deploy` BEFORE deploy → pushed to `main` → auto Vercel Production `zantap-ozp9b64ja` → `zantap.app`. The commit also carries the **per-storefront PWA manifest (ADR-0059)**: customers installing from `/{slug}` get the restaurant-named app launching into that storefront (`lib/pwa/storefront-manifest.ts` + `app/[slug]/manifest.webmanifest/route.ts` + `app/[slug]/layout.tsx`; 404 for missing/suspended vendors). Local validation pre-ship: vitest 314/102, lint clean, `next build` clean. Prod smoke PASS: `/`, `/privacy`, `/terms`, storefront, KDS, `/onboard` all 200; `/ops` 307 (auth); per-slug manifest JSON 200 (name from prod DB, `start_url` `/inka-steakhouse`), unknown-slug manifest 404, storefront HTML links the per-slug manifest; journey media live (`momo.webp` 200, `order.mp4` byte-range 206); comparison section ("Same food. Better system.") + footer in served HTML; runtime log scan info-only. Data note: prod vendor name is literally "Inka Steakhouse Smoke" (leftover from an old smoke rename — consider restoring in Ops). Excluded from the commit: other `.scratch` streams, pycache, third-party generation `.json`/`.err`, stray root screenshot. Owner decisions 2026-08-14: KDS chime (Issue 09b) wanted; **Web Push now wanted too** (requirements briefing delivered; needs its own grill/PRD — SW push handler, permission UX, VAPID keys, subscription storage through the Store seam, order-paid trigger; Android broad support, iOS 16.4+ installed-only); **install-hint banner** (5s auto-hide, storefront + KDS) queued as the next implementable slice. Android install smoke on the owner's device now covers BOTH KDS and storefront installs.
- **Candidate #26 Issues 01–02 deployed + prod-smoked 2026-08-22** (`c7dd0b0` → `dpl_8ay4NowsrHf1HYR97CKJrFRhhrR3` → alias `zantap.app`): unified customer manifest and saved-restaurant passport hub plus Store-backed Vendor update batches/KDS controls. Migration `20260821220000_vendor_update_batches` applied before exact-commit deploy. Production Playwright smoke **7/7 PASS** (`.scratch/customer-restaurant-hub/prod-smoke.mjs`, 390×844): manifest, IndexedDB save, stable-ID hub resolution, update overview/preview, direct recovery, and update toggle restored ON; zero browser errors/overflow. Release-window logs showed one concurrent out-of-scope `P2024` on `/api/vendor/happy-eateries/kds-stream`. Issues 03–04 remain untouched. ADR-0066/0067.
- **Candidate #29 Priority #1 intake UX refinement implemented locally 2026-08-29** on `codex/candidate-29`: the owner-approved exact UI adds removable/replaceable self-build image thumbnails, assisted image/PDF cards, one-open dish accordions, five-dish pagination, and `Visit zantap.app`. Verification: focused 12/12, full 445 passed / 117 expected skips, TypeScript, scoped lint and production build clean. At this local gate, owner visual review, migration, push and deploy were pending; the later release is recorded below. Questions 1–14 remained untouched.
- **Candidate #29 plain-language/review refinement implemented locally 2026-08-30**: short friendly English, reduced-motion-safe transitions, default-hidden language choices controlled by Ops, complete pre-send dish CRUD, and an outlined `Tell ZanTap` handoff with only its WhatsApp icon in brand green, targeting `0784928786` (manual Send; no automatic API). Mobile 390×844 browser QA passed six-dish pagination, Review/Edit and submission with zero errors; a fresh post-correction browser inspection confirmed the neutral CTA/green-icon split with zero new warnings or errors. Final verification: 446/117, scoped lint, TypeScript, Prisma validation and production build clean. At this local gate, release remained pending; the later release is recorded below. Questions 1–14 remained untouched.
- **Candidate #29 Priority #1 DEPLOYED · READ-ONLY PROD-SMOKED 2026-08-30**: owner approved the UI/release; migration `20260829170000_vendor_menu_intake` applied and all 21 migrations report current; commits through `680e4df` pushed to `codex/candidate-29`; detached clean exact-commit deployment `dpl_8SLHNCwgYpC2E6EhZF8qgs8LNLK4` is READY on `zantap.app`. `/menu-intake`, storefront and KDS 200; Ops intake auth redirect expected; live simple-English/default-hidden-language render, browser console and release-window error/warning scans clean. A labelled production submission → Ops → KDS import write smoke awaits action-time owner confirmation because it creates real rows; no WhatsApp message will be sent. Questions 1–14 remain untouched.
- **Candidate #29 Menu Intake upload hotfix DEPLOYED 2026-08-30**: owner write attempts exposed `Vercel Blob: Cannot use private access on a public store`. Root cause was the private intake source seam sharing the public menu-media `BLOB_READ_WRITE_TOKEN`; the upload action threw after the intake row was created, leaving Review stuck and allowing retry duplicates. Commits `d77822d` + `648f187` require the dedicated private `MENU_INTAKE_READ_WRITE_TOKEN`, catch/sanitize upload failures, preserve the successful intake credential immediately, retry the same intake without re-uploading completed files, and lock double taps. Private store `zantap-menu-intake-private` (`store_x3m6SdnEz9CeALA6`) is connected to Production under the `MENU_INTAKE_` prefix; the original public Blob variables remain untouched. Verification: focused 5/5, full 449 passed / 117 expected skips, TypeScript, scoped lint and production build clean. Exact commit `648f187` deployed READY as `dpl_Enq332qdNsoH6ZTcC6zSe2AYrcJ2` on `zantap.app`; route 200 and release-window error log empty. Visual/write browser smoke was deliberately skipped to conserve owner usage. The international phone selector and generated form redesign remain separate pending owner approval; Questions 1–14 remain untouched.
- **Candidate #29 retry recovery DEPLOYED · READ-ONLY PROD-SMOKED 2026-08-30**: focused 10/10, full 455/117, scoped ESLint, TypeScript, production build and browser recovery QA pass. Product repair `9c4365a` makes partial-upload deletion durable, preserves partial multi-photo cleanup progress and restores incomplete reloads to Review using only a safe expected-file manifest. Connectivity returned; exact branch HEAD `d63edf5` pushed and deployed READY as `dpl_DTJE7Qjzr2ekxtqEc1rWTQZTP6gX` on `zantap.app`. `/menu-intake`, storefront and KDS returned 200; Ops intake redirected 307 to login; exact-deployment error/fatal/warning/HTTP-500 scans were empty. Production attachment persistence remains open until a newly labelled owner image/PDF is visible in authenticated Ops. Ops → KDS import requires separate action-time approval; Marketing Lead Form and Questions 1–14 remain untouched.
- **Candidate #29 Ops trash/options + Briefing PIN repair DEPLOYED · READ-ONLY PROD-SMOKED 2026-09-01**: Ops Menu Intake shows submitted sizes/extras, soft-deletes non-imported submissions into a 30-day recoverable trash, and permits permanent database/private-source purge only after retention; imported records remain audit-protected. Briefing new/reset credentials are collision-checked four-digit PINs, the PIN input always remains available, active PIN holders are no longer limited to two sessions, unlock attempts are rate-limited, legacy secrets remain compatible until reset, and the gate footer says `Private viewing`. Focused tests 10/10, full tests 460/117, scoped ESLint, TypeScript, Prisma validation, production build and headed browser QA pass. Migration `20260901190000_menu_intake_ops_trash` applied; all 22 migrations current and `deletedAt` verified. Exact HEAD `5bd7d87` pushed and deployed READY as `dpl_5kvk1NEtjwtgK66oMBKmn3n5TFbv` on `zantap.app`. Briefing, Menu Intake, storefront and KDS 200; Ops intake 307 to login; live copy present; exact-deployment error/fatal/warning/HTTP-500 scans empty. No KDS import occurred; Marketing Lead Form and Questions 1–14 remain untouched.
- **Candidate #29 Stage 1 + customer remote-image fix DEPLOYED · PROD-SMOKED 2026-09-04** (`9dc87fa` → `dpl_CvDf7he6jAQjDQzMcSzLPkQhXc5j` → `zantap.app`): save-once readiness Stage 1, the owner-tested Ops → KDS import workflow, and `/restaurants` remote public-image safety are live. No migration was needed. Production browser smoke confirmed welcome → Guide me → live actionable checklist; `/restaurants` rendered with zero console errors; Ops intake retained its expected auth redirect. The owner had already passed the real import flow, so no production import fixture was created. ADR-0083/0084.
- **Candidate #29 Stage 2 DONE · DEPLOYED · PROD-SMOKED 2026-09-08** (`9772439` + docs `3337db5` → `dpl_FWg1wrFxKR5pKTRJbfoZxjRQPPTo` → `zantap.app`): owner authorized the completed contextual readiness guide; exact `3337db5` pushed to `codex/candidate-29` and deployed from a clean detached checkout. All 22 Production migrations current; no migration/seed run. Focused 12/12, full 482/117, TypeScript, scoped ESLint and remote build pass. Local incomplete-state gate passed 2026-09-05. Read-only prod smoke passed all four desktop/mobile contexts, masked payout, destinations/return chips, Help replay and no automatic reopen; KDS/storefront/restaurants/menu-intake 200, Ops intake 307. Zero browser errors; existing unused-font-preload warnings noted. Exact-deployment runtime scan: 27 requests, zero error/fatal/warning/5xx. No production business write; Question 11 and Marketing Lead Form untouched. ADR-0083, issue 02 and shared handoff updated; all unrelated artifacts preserved.
- **Repository repair + KDS translation port 2026-09-12:** GitHub `main` was fast-forwarded from `6510df6` to Candidate 29 tip `3037217` without rebasing production history. Push-triggered Production `dpl_4FHqF84QTkajoeL1MmHYd3v3BEgf` is Ready on `zantap.app` from that docs-only child of live product SHA `3337db5`. KDS translation is committed locally as `6079447` on `codex/kds-translation-control-c29`; focused 6/6, full 486/117, TypeScript, changed-file lint and build pass. It was not pushed or deployed. The original dirty checkout and detached production snapshot remain preserved. ADR-0089/0090.
- **KDS translation review follow-up ✅ DONE LOCALLY 2026-09-12:** Owner chose full Ops-editable coverage. On `codex/kds-translation-control-c29`, expense labels are display-only while persisted category tokens remain canonical English; ReadinessGuideModal, Help readiness CTA, SetupDrawer guided/status/error copy, and VendorUpdatesPanel metrics are now registered in the Ops-managed KDS catalog. Focused 8/8, full 488/117, TypeScript, changed-file lint, production build, and diff check pass. DPO, Terms, payment runtime, schema, database, push, and deployment were untouched. ADR-0089. Ask before push or deploy.
- **KDS translation ported onto current `main` 2026-09-18 (local only):** Owner liked c29. Branch `feat/kds-translation-on-main` is `5db897c` plus cherry-picks `5edc595`/`52cd57e`/`1167a24` plus the language-availability overlay (ADR-0094; migration `20260916120000_kds_language_availability` unapplied). Q11 phones kept. 2026-09-18 leftover KDS stash kept and not mixed. **Not pushed, not deployed.**
- **KDS translation ✅ DONE · MERGED · Production 2026-09-18:** `f6c3932` fast-forwarded to `origin/main`. Migration `20260916120000_kds_language_availability` applied (defaults true). Production `dpl_SPtBgijdcTpfb63jGKZ3L1ePT1Nd` READY on `zantap.app`. Local gate: 521 passed / 117 skipped (VERCEL cleared for the menu-intake blob test), scoped ESLint clean, `next build` clean. Curl: `/` 200 phone picker; KDS 200 `kds-dark`. Leftover 2026-09-18 stash kept. Owner self-serves Soon / selector flags from Ops → Settings → KDS languages; agents do not toggle live flags unless asked. ADR-0089/0094.
- **KDS English catalog extracted 2026-09-18 (local, no wiring):** `locales/kds.en.json` (861 keys) + `locales/KDS_LANGUAGE_EXTRACTION.md`. No translations, no i18n integration, no app behavior change. Awaiting owner approval of the English JSON.
- **KDS rw/fr/sw wording loaded into the Ops editor 2026-09-22 (local, NOT committed/deployed):** `locales/kds.{rw,fr,sw}.json` (861 keys each, order + placeholder parity with `kds.en.json`) generated into in-repo baselines `lib/i18n/kds-translations/{rw,fr,sw}.ts` + `lib/i18n/kds-baselines.ts`, wired as `baselines={KDS_BASELINE_TRANSLATIONS}` on the `surface="kds"` editor in `app/ops/(dashboard)/settings/page.tsx`. Ops → Settings → Languages (KDS copy) now reads `0 overrides saved · 0 untranslated` per locale; only owner edits become DB overrides. Mapping is by **section + exact English value**, never a camelCase→kebab transform (`3040Min` ↔ `30-40-min` is not reversible); regenerate with `node .scratch/kds-translation-baselines/generate-baselines.mjs`. **Runtime baseline fallback added the same day (owner-approved after the KDS language switch visibly did nothing):** `getKdsTranslations()` merges the baselines under DB overrides (override → baseline → English) and `pickKdsLocales()` serializes only Ops-enabled locales; the merge must stay in that **server-only** module because client components import `createKdsTranslator` from `lib/i18n/kds-localize.ts` (importing baselines there would ship all three dictionaries into the KDS client bundle). A store read failure now keeps baselines instead of dropping to English. **Untranslated-looking kitchen ≠ missing dictionary: Ops language availability (ADR-0094) is a separate gate — Kinyarwanda is currently flagged "Soon", so that option is disabled and `resolveKdsLocale` pins those devices to English.** Preserved continuity trees under `.scratch/repository-continuity/preserved-*` stay **included** in vitest (owner 2026-09-22 — agent documentation); their KDS translations test is synced to live expectations. `vitest.config.ts` clears `VERCEL` so `.env.production.local` no longer false-fails menu-intake blob unit tests. The 177 `notYetRegistered` strings stay unregistered (the Ops save path rejects unknown keys). Local gate: full **535 passed / 117 skipped**, `tsc` clean, scoped ESLint clean, `next build` clean, Ops browser harness 8/8, KDS switch harness 9/9. **Shipped 2026-09-22:** `b0289f9` pushed to `main` → Production `dpl_Hn2FAFCjHxNLL4ky8onYp6Bsx1vn` READY on `zantap.app` (aliases include `zantap.app`); curl KDS 200 (`kds-dark` + language selector), Ops settings 307 (auth). ADR-0095. Do **not** `git stash` in this checkout — three load-bearing stashes.
