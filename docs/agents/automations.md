# Devin automations

Three Devin automations run against this repository. They only read, run checks,
and open pull requests from `devin/` branches — they never push to `main`, change
Vercel/Ops production settings, or run migrations against the live database.

| When | What it does |
| --- | --- |
| Every push to `main` | Release gate for the money path: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, the two prod-only checks from `AGENTS.md` (`"use server"` exports, status-gated KDS reads), a storefront → MoMo PIN `12345` → KDS smoke against a production build, and a live curl of `zantap.app`. Opens one fix PR when something is red. |
| Monday 08:12 (Africa/Kigali) | Reconciles what merged and shipped against the `AGENTS.md` status log, `docs/agents/codex-cursor-shared-handoff.md`, `.scratch/architecture-candidates.md`, issue checkboxes and `docs/adr/`, and opens one documentation PR. |
| Friday 16:42 (Africa/Kigali) | Audits branches and `main`-vs-Production drift: deletes branches strictly merged into `main`, flags unmerged work and anything recorded as shipped that is not on `main` or live. |

Manage them at https://app.devin.ai/automations.
