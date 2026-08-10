# Issue 05 — Ops leads inbox

Status: **done · implemented locally · not deployed** · Track 1 · ADR-0046 §9 (depends: Issue 04)

Owner refinement requested 2026-08-10: expand this issue from an Ops-only
follow-up inbox into dual-channel lead routing. Every valid marketing lead must
first persist durably and appear in ZanTap's `/ops` dashboard; the operator must
also be able to configure the WhatsApp number used for the lead handoff. The
owner approved the pilot handoff on 2026-08-10:

1. **Pilot handoff (approved):** after durable submission, show the partner a
   `Continue on WhatsApp` action addressed to the configured number with a
   prefilled summary. The partner must tap Send; the Ops lead still exists if
   they abandon WhatsApp.
2. **Automatic notification (deferred):** send the lead server-side through an
   approved WhatsApp Business API provider. This requires provider credentials, template
   approval/error handling, and a retry/audit model; `wa.me` cannot auto-send.

- [x] Control API: `/api/operator/v1/leads` list + status update, `OPERATOR_API_KEY`-guarded, audit-log entries (follow ADR-0039 patterns).
- [x] `/ops` UI: Leads tab — table (name, type, phone, area, age, status), search, status progression NEW → CONTACTED → ONBOARDED/CLOSED.
- [x] One-tap `wa.me/<phone>` follow-up link per lead (reuse WhatsApp URL helper).
- [x] Operator settings: view/update a validated lead-receiving WhatsApp number;
      never expose provider credentials to the browser; audit configuration changes.
- [x] Lead-form dual routing follows the owner-approved delivery mode above;
      durable persistence is always the source of truth and WhatsApp failure or
      abandonment must never lose the Ops lead.
- [x] No email automation in this slice.
- [x] Tests + build; local operator/browser smoke.
- [x] Handoff per protocol.

Verification: Prisma schema valid; TypeScript + lint clean; 274 tests passed / 81
Prisma-gated skipped; production build clean; local browser smoke passed settings
save → public Lead submit → configured WhatsApp CTA → `/ops/leads` visibility →
status progression, with no console errors or horizontal overflow. Production
migration/deploy/smoke remain a separate owner-authorized release step.
