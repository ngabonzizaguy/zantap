# Issue 10 — Vendor business hours / open-state

Status: **ready-for-agent** · Track 4 · ADR-0046 §12

Worst pilot failure mode: customers ordering from a closed kitchen.

- [ ] Schema: per-day open/close windows (Kigali timezone semantics per ADR-0030) + a manual override toggle ("temporarily closed" / KDS Live-Off relationship — reconcile with the existing live/off control, don't duplicate it).
- [ ] Store verbs + both adapters + migration + contract tests.
- [ ] KDS Setup editor (owner-token-guarded) — this also flips the "Business Hours" optional-checklist row from `comingSoon` to actionable (`lib/vendor/optional-checklist.ts`, ADR-0026).
- [ ] Storefront: closed banner + next-open time; checkout blocked server-side while closed (not just UI).
- [ ] i18n-ready copy.
- [ ] Tests + build; storefront/KDS smoke.
- [ ] Handoff per protocol (ADR for hours semantics).
