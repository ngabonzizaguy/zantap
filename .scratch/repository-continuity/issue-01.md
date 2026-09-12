# Repository + branch continuity audit

Status: complete — main repaired, translation ported, safe cleanup finished

Audited 2026-09-12. No merge, reset, deploy, or branch deletion was performed.

## Progress

- [x] Inventory Desktop ZanTap folders vs Git and production.
- [x] Fetch remotes and classify every local and GitHub branch.
- [x] Confirm live production SHA and Vercel deployment.
- [x] Fast-forward GitHub `main` to `codex/candidate-29` tip `3037217`.
- [x] Confirm Vercel Production still tracks `3337db5` / `3037217` lineage after `main` catch-up. Push-triggered Production `dpl_4FHqF84QTkajoeL1MmHYd3v3BEgf` is Ready on `zantap.app`.
- [x] Port KDS translation WIP off dirty `codex/kds-translation-control` onto `codex/kds-translation-control-c29`, based on repaired `main`.
- [x] Renumber colliding unshipped ADRs: poster `0083` → `0091`; storefront glass `0084` → `0092`.
- [x] Remove the damaged Candidate 26 temp worktree and delete branches proven merged into repaired `main`. Protected dirty/evidence worktrees and unique branches remain.

## Production truth (Certain)

- Repo: `https://github.com/ngabonzizaguy/zantap.git`
- Original audited live release: `dpl_FWg1wrFxKR5pKTRJbfoZxjRQPPTo`, git SHA `3337db5e5598ae7c2b9e53ceb36481a4b2904dde`
- Current Production after the main catch-up: `dpl_4FHqF84QTkajoeL1MmHYd3v3BEgf`, Ready on `zantap.app`; repaired-main SHA `3037217` is the docs-only child of `3337db5`.
- Aliases: `zantap.app`, `www.zantap.app`, `zantap-psi.vercel.app`
- Deployed from Candidate 29 line, not from GitHub `main`.
- GitHub `origin/main` = `3037217` (Candidate 29 intended baseline).

## Keepers

| Path / branch | SHA | Role |
|---|---|---|
| `C:\Users\G\Desktop\2025\Projects\zantap-candidate-29` · `codex/candidate-29` | `3037217` | Intended baseline. 26 commits ahead of GitHub `main`. Parent of tip is prod `3337db5`. Extra commit is docs. |
| `C:\Users\G\Desktop\2025\Projects\zantap-release-stage2-20260908` | `3337db5` detached | Exact live production snapshot. Keep until `main` is repaired. |
| `C:\Users\G\Desktop\2025\Projects\zantap` · `codex/kds-translation-control` | tip `6510df6` + dirty WIP | Uncommitted KDS translation. Do not mix with Candidate 29 merge. |

## Do not merge wholesale

- `codex/ops-kds-marketing-batch` (`zantap-codex-ops-kds-marketing`) — 8 unique, 41 behind.
- `codex/direction-a-independent` (`zantap-codex-direction-a`) — 1 unique, 61 behind.
- `feat/glass-liquid-morphism` — 1 unique old glass experiment.
- `codex/inventory-pagination` — 1 unique docs-only closeout.
- Remote `claude/zantap-ui-design-v9foax` — 3 unique docs prompts.

Most other local/GitHub branches are already ancestors of Candidate 29 (zero unique product commits).

## ADR collision

Candidate 29 `0083`/`0084` = KDS readiness + customer-update images. Dirty Cursor tree untracked `0083`/`0084` = posters + storefront glass. DPO/legal ADRs also must start **≥0091**.

## Next session order

1. Review `codex/kds-translation-control-c29` at `6079447`; it is local-only and not deployed.
2. If approved, explicitly authorize pushing/releasing that branch.
3. Keep the original dirty `zantap`, Candidate 29 evidence worktree, and detached production snapshot until their remaining local artifacts are deliberately archived.
4. Terms / DPO remain a separate owner-expanded scope.
