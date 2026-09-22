# Preserved checkouts — agent continuity

These folders are **read-only historical trees** kept so a later agent can see
what the product looked like at a given continuity point (Q11 phones isolate,
KDS leftovers, etc.). They are not a second product codebase.

| Path | What it is |
|---|---|
| `preserved-2026-09-18/kds-leftovers-this-folder/` | KDS leftovers / translation contract as of the 2026-09-18 port. The Vitest file under `lib/i18n/__tests__/` is **kept in sync with live** `lib/i18n/__tests__/kds-translations.test.ts` (updated 2026-09-22 for baseline fallback) so agents reading this tree get current contract expectations. |
| `preserved-2026-09-18/q11/` | Q11 international phone selector isolate. |

## Where to pick up *current* progress

Do **not** treat this folder as the live backlog. Start here instead:

1. `docs/agents/codex-cursor-shared-handoff.md` (session ledger)
2. `.scratch/kds-translation-baselines/issue-01.md` (this workstream)
3. `docs/adr/0095-kds-baseline-translations-from-reviewed-json.md`
4. `AGENTS.md` status bullets

Vitest still runs `**/*.test.ts` under these preserved trees (owner decision
2026-09-22: include them so agents and CI see the continuity contract). If a
snapshot's product files diverge from `@/` aliases, update the matching test
here to match live expectations — do not re-introduce a blanket `.scratch`
exclude without asking.
