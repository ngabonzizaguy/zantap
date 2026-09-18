# ADR-0093: Canonical `zantap` folder on GitHub `main`; Q11 phones isolated

Date: 2026-09-18
Status: Accepted · merged to `main` · Production `dpl_AbmSN4zVWPhhi8VuhddoQPvjKErY` (`zantap-jqur1qppf`) · 2026-09-18

## Context

GitHub `origin/main` and live Production were already on `3037217` / `dpl_4FHqF84QTkajoeL1MmHYd3v3BEgf`. ADR-0090 described an earlier lag (`origin/main` at `6510df6`) that a prior session already repaired. This folder was still checked out at `6510df6` on `codex/kds-translation-control` with mixed uncommitted phones, leftover KDS translation, and docs.

The owner forbade re-running the 2026-09-12 fast-forward, forbade deleting this project folder, and forbade mixing KDS translation (canonical copy: `zantap-kds-translation-c29`) with Q11 phones.

## Decision

Keep `C:\Users\G\Desktop\2025\Projects\zantap` as the business working copy. Check it out onto GitHub `main` (`3037217`) without rewriting `main`. Preserve the mixed dirty tree as a stash plus `.scratch/repository-continuity/preserved-2026-09-18/`. Isolate Q11 onto `feat/q11-international-lead-phone` (`f32fca8`) with only the listed Lead-phone files. After owner approval, fast-forward `main` to `3ff2bc2` and ship Production. Leave KDS translation in the other folder.

## Consequences

GitHub `origin/main` is `5db897c` (Q11 `f32fca8` + docs). Live phone picker is Production `dpl_AbmSN4zVWPhhi8VuhddoQPvjKErY` on `zantap.app`. Leftover KDS files from this folder remain in stash `2026-09-18 tracked dirty on 6510df6 before canonical main` — do not drop it. Canonical translation work is now ported locally onto `feat/kds-translation-on-main` (ADR-0094 for language availability). ADR-0090's "do not deploy GitHub main" instruction is obsolete.
