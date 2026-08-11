# ADR-0053: Ops Lead inbox and configurable WhatsApp handoff

- **Status:** Accepted
- **Date:** 2026-08-10; amended 2026-08-12
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
   after that succeeds does it attempt recipient assignment and optionally return
   a WhatsApp URL. An assignment or handoff failure never changes the successful
   Lead result.
2. **The pilot is user-confirmed.** The public success state shows `Continue on
   WhatsApp` only when routing is enabled and a recipient exists. The partner must
   tap Send. Automatic WhatsApp Business API delivery is deferred.
3. **A recipient directory behind the Store seam.** The original singleton
   phone setting is superseded by `LeadRoutingRecipient` rows that Ops can add,
   edit, remove, enable, and disable independently. Phone numbers are canonical
   E.164 digits; removal archives a recipient so assignment history survives.
   `LeadRoutingSettings` remains an internal singleton only for the round-robin
   cursor. The refinement migration is
   `20260811234500_multi_recipient_lead_routing`.
4. **Operator control stays two-plane.** `/api/operator/v1/leads` and
   `/api/operator/v1/lead-routing` are `OPERATOR_API_KEY` guarded. `/ops/leads`
   and `/ops/settings` call them through `lib/operator-client`; browser code never
   imports the Store or sees operator credentials.
5. **Lead progression is forward-only.** Operators may move `NEW → CONTACTED`,
   `NEW → CLOSED`, and `CONTACTED → ONBOARDED/CLOSED`. Onboarded and Closed are
   terminal in this pilot.
6. **Mutations and assignments are audited.** Status changes record the Lead id
   and new status. Recipient CRUD records the recipient id, enabled state where
   relevant, and only the final four phone digits. Every routed Lead gets one
   immutable `LeadRoutingAssignment` snapshot (recipient id, name, phone, and
   assignment time), so later edits/removal cannot rewrite routing history.
7. **Responsive operator UI.** Desktop uses the existing table pattern; mobile
   uses cards with 44px controls. Search/filtering is local over the server-fetched
   list, and pending/error/success states are explicit.
8. **Concurrency-safe round-robin.** After `createLead` completes, one Store
   operation assigns the Lead to the next enabled, non-archived recipient. The
   in-memory adapter performs the cursor change synchronously. Prisma takes a
   transaction-scoped Postgres advisory lock, then selects the next recipient,
   inserts the immutable assignment, and updates the cursor in one SQL statement.
   Assignment is idempotent by unique Lead id. With no enabled recipient, the
   Lead remains stored and the public response simply omits WhatsApp.
9. **One public action.** Even with multiple enabled recipients, the partner sees
   one `Continue on WhatsApp` action for that Lead's assigned recipient. ZanTap
   never exposes a recipient chooser or multiple partner-facing buttons.

## Consequences

- ZanTap retains every valid setup request even when WhatsApp is abandoned.
- The assigned receiving number becomes visible to a prospective partner in the
  generated `wa.me` URL, which is inherent to the approved pilot.
- Disabling/removing a recipient affects only future assignment; historical Leads
  keep their assignment snapshot for Ops visibility and audit.
- Lead volume is currently small enough for `listLeads()` plus client filtering;
  pagination/virtualization can be added without changing submission behavior.
- Apply the migration before deploying code that reads routing settings.
- A future automatic WhatsApp integration requires a separate ADR and provider
  readiness; it must not silently replace this user-confirmed flow.

## Verification

- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run lint`
- Focused final checks: 96 unit/contract/control tests passed; the shared Lead
  contract passed 11/11 against the isolated Postgres test schema, including a
  12-way concurrent assignment run.
- `npm run build`
- Local browser smoke: save routing → submit public Lead → see configured WhatsApp
  CTA → see Lead in `/ops/leads` → advance to Contacted; no console errors or
  horizontal overflow at the browser's minimum mobile width and landscape.
