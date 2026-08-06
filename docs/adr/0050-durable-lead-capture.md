# ADR-0050: Durable marketing lead capture through the Store seam

- **Status:** Accepted
- **Date:** 2026-08-06
- **Branch:** `main`
- **Implements:** ADR-0046 §9; product-restructure Issue 04

## Context

The production marketing form at `/` initially validated a setup request in
the browser and opened a prefilled WhatsApp message. That made contact easy,
but ZanTap had no durable record if the visitor abandoned WhatsApp. Issue 05's
operator follow-up inbox also needs a stable lead lifecycle behind the existing
server-only Store seam.

## Decisions

1. **Lead domain model:** `Lead` stores business/contact details, an optional
   message and source, server-recorded consent and creation timestamps, and the
   lifecycle `NEW | CONTACTED | ONBOARDED | CLOSED`. A Lead is not a Vendor;
   onboarding may later create a Vendor from it.
2. **One existing persistence seam:** the Store gains only `createLead`,
   `listLeads`, and `updateLeadStatus`. Both in-memory and Prisma adapters
   satisfy the same behavioral contract. `createLead` canonicalizes phone
   numbers inside each adapter so non-form callers cannot bypass storage
   normalization. `listLeads` is newest-first for the follow-up inbox.
3. **Durable database shape:** Prisma owns the `Lead` table and `LeadStatus`
   enum. Status/created-time indexes support the next Ops inbox slice. The
   migration is `20260806213500_durable_lead_capture`.
4. **Server Action interface:** the client calls the async-only `submitLead`
   Server Action and never imports the Store. The action trims and bounds all
   fields, accepts only Rwanda mobile numbers canonicalized to `2507…`, records
   consent on server receipt, and returns stable error codes so UI copy stays in
   `lib/marketing/copy.ts`.
5. **Abuse controls:** a hidden `website` honeypot is discarded with an
   indistinguishable success. Valid submissions are limited to 10 per IP per 15
   minutes and 3 per canonical phone per hour. These use the existing
   in-process fixed-window limiter and are therefore best-effort per server
   instance, not a distributed security boundary.
6. **Conversion behavior:** the form keeps its approved layout, disables the
   submit button while awaiting the action, preserves entered values on an
   error, and shows success only after the Store accepts the Lead. The interim
   WhatsApp window handoff is removed; ZanTap still follows up through WhatsApp.

## Consequences

- Issue 05 can build the operator Lead inbox entirely on the Store interface.
- Lead persistence is durable in production once the migration is applied;
  rate-limit counters intentionally are not durable or globally coordinated.
- The migration was created and validated in this session but not applied or
  deployed, per owner scope. Run `npm run db:deploy` before deploying this code.
- A future distributed limiter can replace the internal limiter without
  changing the Server Action or Store interfaces.

## Verification

- `npx prisma validate`
- `git diff --check`
- `npm run lint`
- `npm test` — 263 passed, 80 Prisma-gated skipped
- `npm run build`

## References

- `.scratch/product-restructure/issue-04.md`
- `.scratch/product-restructure/issue-05.md`
- ADR-0046 §9
- ADR-0049 decision 4
