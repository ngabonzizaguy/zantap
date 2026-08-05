# Issue 02 — zantap.app domain cutover

Status: **needs-info — blocked on owner purchasing zantap.app** · Track 1 · ADR-0046 §6

Once the owner owns `zantap.app`:

- [ ] Owner: buy `zantap.app` and add it to the Vercel project (owner/dashboard step; agent cannot).
- [ ] Set `NEXT_PUBLIC_BASE_URL=https://zantap.app` in Vercel Production (redeploy required — public env is build-time).
- [ ] Update `ZANTAP_OPERATOR_API_URL` to `https://zantap.app/api/operator/v1` (see ADR-0039 prod cutover note).
- [ ] Sweep docs/env examples for `zantap.ai` and the Vercel alias; replace with `zantap.app`.
- [ ] Curl smoke: storefront, KDS, `/onboard`, ops API over the new domain; share/QR links emit `zantap.app`.
- [ ] Handoff per protocol.
