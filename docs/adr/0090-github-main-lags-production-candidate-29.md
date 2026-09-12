# ADR-0090: GitHub `main` lags live production; Candidate 29 is the intended baseline

Date: 2026-09-12
Status: Accepted (repair completed 2026-09-12)

## Context

A 2026-09-12 read-only audit compared Desktop folders, every local/GitHub branch, and Vercel Production. Live `zantap.app` is deployment `dpl_FWg1wrFxKR5pKTRJbfoZxjRQPPTo` at git SHA `3337db5`. That SHA lives on `codex/candidate-29`. GitHub `origin/main` remains `6510df6` (private briefing screens, 2026-08-27). Deploying GitHub `main` would drop menu intake, KDS readiness Stages 1–2, the restaurants image fix, and two migrations already applied in production.

The Cursor workspace `zantap` is on `codex/kds-translation-control` at the old `main` tip, with uncommitted translation files. Several leftover branches hold unique commits that were superseded, not missing product.

The owner asked to postpone Git promotion, branch cleanup, and translation rebase to another session.

## Decision

Treat `codex/candidate-29` tip `3037217` as the intended `main` (production `3337db5` plus a docs commit). Do not deploy or merge GitHub `main` until it is fast-forwarded to that tip. Do not merge leftover branches wholesale (`codex/ops-kds-marketing-batch`, `codex/direction-a-independent`, `feat/glass-liquid-morphism`, and similar). Keep the dirty translation worktree intact until the translation files are copied onto a new branch from the repaired `main`. Keep the detached production snapshot worktree until `main` is repaired. New ADRs start at 0090+ because 0083/0084 collide between Candidate 29 and uncommitted marketing notes.

## Consequences

GitHub `main` was fast-forwarded from `6510df6` to `3037217` on 2026-09-12. Vercel's existing Production deployment remained on the Candidate 29 lineage while the push-triggered docs-only child build ran. KDS translation work was copied onto `codex/kds-translation-control-c29`, based directly on repaired `main`; the original dirty tree was retained. Terms/DPO work remains outside this repair session. Tracking: `.scratch/repository-continuity/issue-01.md`.
