# Issue 02 — zantap.app domain cutover

Status: **✅ DONE · cutover complete & prod-smoked 2026-08-06** · Track 1 · ADR-0046 §6

- [x] Owner: buy `zantap.app` and add it to the Vercel project (owner/dashboard step; agent cannot). — Done 2026-08-06: `zantap.app` = Production, `www.zantap.app` → 308 redirect to apex, `zantap-psi.vercel.app` alias retained.
- [x] Set `NEXT_PUBLIC_BASE_URL=https://zantap.app` in Vercel Production (redeploy required — public env is build-time). — Done via CLI (`vercel env rm/add`).
- [x] Update `ZANTAP_OPERATOR_API_URL` to `https://zantap.app/api/operator/v1` (see ADR-0039 prod cutover note). — Done via CLI.
- [x] Redeploy: `vercel redeploy dpl_CSVEC8L2zu7nRqeQc4tN65PpHxCc` → new prod `zantap-bexc31rf4` → aliased `https://zantap.app` (built with new env; NOT deployed from the local working tree, which held uncommitted restructure work).
- [x] Sweep docs/env examples for `zantap.ai` and the Vercel alias; replace with `zantap.app`. — Live artifacts updated: `lib/base-url.ts` comments, `lib/__tests__/base-url.test.ts` fixtures (7/7 green), `.env.example`, ADR-0032 consequence line, stale AGENTS.md ops note. Dated historical log entries (AGENTS.md status log, ADR-0041/0046 context, `.scratch` archives) deliberately left as history.
- [x] Curl smoke: `zantap.app` root 307→`/inka-steakhouse`, storefront/KDS/`/onboard` all 200, `www` 308→apex; deployed JS chunk contains `zantap.app` (NEXT_PUBLIC inlined — verified in `/_next/static/chunks/`).
- [x] Handoff per protocol.

Remaining (non-blocking): QR/printed material can now use `zantap.app`; ops API smoke over the new origin was not exercised beyond env update (OPERATOR key unchanged, same-origin co-located route).
