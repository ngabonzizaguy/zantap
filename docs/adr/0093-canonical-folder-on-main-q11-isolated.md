# ADR-0093: Canonical `zantap` folder on GitHub `main`; Q11 phones isolated

Date: 2026-09-18
Status: Accepted · local only · not pushed

## Context

GitHub `origin/main` and live Production were already on `3037217` / `dpl_4FHqF84QTkajoeL1MmHYd3v3BEgf`. ADR-0090 described an earlier lag (`origin/main` at `6510df6`) that a prior session already repaired. This folder was still checked out at `6510df6` on `codex/kds-translation-control` with mixed uncommitted phones, leftover KDS translation, and docs.

The owner forbade re-running the 2026-09-12 fast-forward, forbade deleting this project folder, and forbade mixing KDS translation (canonical copy: `zantap-kds-translation-c29`) with Q11 phones.

## Decision

Keep `C:\Users\G\Desktop\2025\Projects\zantap` as the business working copy. Check it out onto GitHub `main` (`3037217`) without rewriting `main`. Preserve the mixed dirty tree as a stash plus `.scratch/repository-continuity/preserved-2026-09-18/`. Isolate Q11 onto `feat/q11-international-lead-phone` (`f32fca8`) with only the listed Lead-phone files. Do not push or deploy until the owner approves. Leave KDS translation in the other folder.

## Consequences

New product work in this folder starts from live `main`. Q11 is reviewable as one commit ahead of `origin/main`. Leftover KDS files from this folder are in stash `2026-09-18 tracked dirty on 6510df6 before canonical main` and the preserve directory; they are not on the Q11 branch. ADR-0090's "do not deploy GitHub main" instruction is obsolete for the current `3037217` tip.
