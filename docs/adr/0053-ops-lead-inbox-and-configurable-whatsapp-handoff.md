# ADR-0053: Ops Lead inbox and configurable WhatsApp handoff

- **Status:** Accepted
- **Date:** 2026-08-10
- **Implements:** Product Restructure Issue 05; ADR-0046 §9; ADR-0050

## Context

The public marketing form durably stores a Lead, but operators cannot see or
progress those Leads in ZanTap's `/ops` dashboard. The earlier interim form
opened WhatsApp without first guaranteeing persistence; ADR-0050 correctly
retired that transport. The owner now wants both channels: a reliable operator
inbox and an optional WhatsApp continuation to a recipient configured in `/ops`.

`wa.me` cannot deliver a message automatically. It can only open a prefilled
conversation that the prospective partner reviews and sends. Automatic delivery
would require an approved WhatsApp Business API provider, credentials, templates,
delivery-status handling, and retries.

## Decisions

1. **Persistence is authoritative.** `submitLead` creates the Lead first. Only
   after that succeeds does it read routing settings and optionally return a
   WhatsApp URL. A settings read or handoff failure never changes the successful
   Lead result.
2. **The pilot is user-confirmed.** The public success state shows `Continue on
   WhatsApp` only when routing is enabled and a recipient exists. The partner must
   tap Send. Automatic WhatsApp Business API delivery is deferred.
3. **One platform setting behind the Store seam.** `LeadRoutingSettings` is a
   singleton Postgres row (`id = "default"`) with `whatsappEnabled`, canonical
   E.164 `whatsappPhone`, and `updatedAt`. Both Store adapters implement get/update;
   the migration is `20260810222500_lead_routing_settings`.
4. **Operator control stays two-plane.** `/api/operator/v1/leads` and
   `/api/operator/v1/lead-routing` are `OPERATOR_API_KEY` guarded. `/ops/leads`
   and `/ops/settings` call them through `lib/operator-client`; browser code never
   imports the Store or sees operator credentials.
5. **Lead progression is forward-only.** Operators may move `NEW → CONTACTED`,
   `NEW → CLOSED`, and `CONTACTED → ONBOARDED/CLOSED`. Onboarded and Closed are
   terminal in this pilot.
6. **Mutations are audited.** Status changes record the Lead id and new status.
   Routing changes record enabled state and only the recipient's final four digits,
   avoiding a second full-phone copy in audit detail.
7. **Responsive operator UI.** Desktop uses the existing table pattern; mobile
   uses cards with 44px controls. Search/filtering is local over the server-fetched
   list, and pending/error/success states are explicit.

## Consequences

- ZanTap retains every valid setup request even when WhatsApp is abandoned.
- The configured receiving number becomes visible to a prospective partner in the
  generated `wa.me` URL, which is inherent to the approved pilot.
- Lead volume is currently small enough for `listLeads()` plus client filtering;
  pagination/virtualization can be added without changing submission behavior.
- Apply the migration before deploying code that reads routing settings.
- A future automatic WhatsApp integration requires a separate ADR and provider
  readiness; it must not silently replace this user-confirmed flow.

## Verification

- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test` — 274 passed / 81 Prisma-gated skipped
- `npm run build`
- Local browser smoke: save routing → submit public Lead → see configured WhatsApp
  CTA → see Lead in `/ops/leads` → advance to Contacted; no console errors or
  horizontal overflow at the browser's minimum mobile width and landscape.
