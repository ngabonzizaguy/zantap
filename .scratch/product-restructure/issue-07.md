# Issue 07 — Vendor payment-verification state for manual MoMo

Status: **ready-for-agent** · Track 2 · ADR-0046 §8

Manual-USSD orders are customer-self-confirmed (ADR-0033); the KDS must stop
representing them as verified. **Grill-Me constraint applies: this touches
payment state — ask structural questions / re-read ADR-0001/0033 before
emitting code.**

Design intent (verify against schema before implementing):
- New verification dimension on manual-MoMo payments: `UNVERIFIED` (customer
  says paid) → `VENDOR_VERIFIED`. Simulated-MoMo payments are verified at
  payment time. Orthogonal to `kitchenStage` (ADR-0013 pattern).
- KDS ticket badge: "Customer says paid — verify in MoMo" vs "Verified"; a
  vendor action (owner-token-guarded) marks verified; filter/sort aware.
- Payment-gated KDS visibility unchanged: PENDING still hidden; unverified
  PAID still reaches the kitchen (they must see the order) but clearly badged.
- History/export/receipts carry the verification state.

- [ ] Store verbs + both adapters + migration + contract tests.
- [ ] Server action (async-only exports) + KDS UI badge/action/filter.
- [ ] Never render unqualified "PAID via MoMo" for unverified manual orders (extends the known-issue 0002 lesson).
- [ ] Tests incl. simulate-mode regression; `npm run build`.
- [ ] ADR (payment verification model).
- [ ] Handoff per protocol.
