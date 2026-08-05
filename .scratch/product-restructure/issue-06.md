# Issue 06 — Operator-gated owner-token recovery

Status: **ready-for-agent** · Track 2 · ADR-0046 §7

Retire self-serve recovery: today `recoverOwnerToken(slug, phone)` instantly
reissues a token, and both inputs are public on the storefront (hijack risk).

- [ ] Public "Recover access" (splash dialog + `/onboard?recover=1`) becomes a **request**: it records a `VendorRecoveryEvent` (exists) and shows "an operator will contact you" — it must NOT return a token.
- [ ] Ops recovery inbox: operator reviews the request, verifies the human out-of-band (call/WhatsApp), and reissues from `/ops` (reissue/revoke verbs already exist per ADR-0039) with an audit entry.
- [ ] Delete/neutralize the instant-reissue server path so no code path mints a token without an operator action; keep rate limiting on requests.
- [ ] Update onboarding/help copy accordingly (i18n-ready constants).
- [ ] Tests: request creates event + returns no token; operator reissue works; old path gone. `npm run build` (prod-sensitive `"use server"` rules apply).
- [ ] ADR documenting the recovery-policy change (supersedes the self-serve part of ADR-0024/0029 behavior).
- [ ] Handoff per protocol.
