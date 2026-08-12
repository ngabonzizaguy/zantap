# Issue 05 — Ops leads inbox

Status: **done · deployed · multi-recipient routing prod-smoked · production configured** · Track 1 · ADR-0046 §9 (depends: Issue 04)

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

Release progress 2026-08-11: owner explicitly approved production release of
`1626c13`; migration `20260810222500_lead_routing_settings` applied successfully;
`main` pushed and Vercel Production deployment
`dpl_4b9iYy6gHFcP4fsShoBdsLJuxQBE` (`zantap-pb9sk1dwr`) reached Ready and owns
`zantap.app`. Root, `/ops/login`, `/ops/leads`, and `/ops/settings` returned 200
through the production alias; guarded Lead and routing reads returned 200 and the
release-window runtime log scan was clean. Remaining gate: the supplied recipient
was the literal placeholder `<E.164 number>`, and both available browser profiles
require operator sign-in. Configure the actual approved number in `/ops/settings`,
then submit a labeled public Lead and verify `/ops/leads` persistence precedes the
`Continue on WhatsApp` action.

Continuation checkpoint 2026-08-11: the connected Chrome Ops tab still redirects
to `/ops/login`, and no actual approved recipient has been supplied in place of the
placeholder. The login tab is left open for the owner. No routing setting, Lead,
status, application code, deployment, or production data was changed in this pass.

Continuation re-check 2026-08-11: direct navigation in the claimed Chrome tab to
`https://zantap.app/ops/settings` again redirected to `/ops/login`; the visible page
was the empty operator sign-in form. The supplied routing recipient was again a
literal placeholder (`<APPROVED E.164 NUMBER>`), not a usable E.164 value. No secret
or phone was inspected or recorded, and no routing setting, Lead, WhatsApp action,
status, code, deployment, or production data was changed. The login tab remains open
for owner authentication; after sign-in, provide the actual approved E.164 recipient
to run the persistence-first production smoke.

Owner refinement 2026-08-11: Ops must support multiple WhatsApp routing recipients,
each independently enabled/disabled. The first two approved recipients were supplied;
only redacted suffixes `…8786` and `…7771` are recorded here. Recipient `…7771` is
temporarily unavailable and should remain disabled until the owner enables it. The
single-recipient implementation remains live until this refinement is implemented,
migrated, deployed, configured, and smoked. Open behavior decision: when more than one
recipient is enabled, choose one recipient per Lead (recommended round-robin), expose
multiple partner-facing actions, or use ordered primary/fallback routing.

Multi-recipient refinement 2026-08-12:

- [x] Ops recipient directory supports add, edit, archive-remove, enable, and disable.
- [x] Every Lead persists before assignment; assignment failure omits WhatsApp without
      rolling back the Lead.
- [x] One enabled recipient is assigned through the Store seam with idempotent,
      concurrency-safe round-robin in both adapters.
- [x] Immutable assignment snapshots are visible in `/ops/leads` and control mutations
      record redacted audit metadata.
- [x] The public success state exposes at most one `Continue on WhatsApp` action.
- [x] Migration applied, build/test/review completed, committed, pushed, and deployed.
- [x] Recipient `…8786` configured and enabled in authenticated Production Ops.
- [x] Recipient `…7771` configured disabled after the owner supplied its full
      approved number; project evidence remains redacted to the suffix.

Implementation evidence: `5aee9b2` plus hydration review fix `943efbc`; migration
`20260811234500_multi_recipient_lead_routing` is applied. Prisma validation,
TypeScript, lint, and production build are clean. The full suite passed 284 tests with
89 Prisma-gated skips; focused checks passed 97 tests; the isolated Postgres Lead
contract passed 11/11, including a 12-way concurrent assignment run.

Redacted production evidence: Vercel release `dpl_C5BBDbY4wiZVypSAvofSz2quRqpX`
deployed the routing model; hydration-fix release
`dpl_HTWEh9G18kJ9QF5Er9hatqfuTScq` from `943efbc` is Ready on `zantap.app`.
Authenticated Ops configured `…8786`. With routing paused, labeled Lead
`ISSUE05 PERSIST FIRST 20260812 0017` was stored and verified in `/ops/leads` as
`Unassigned`, with no public WhatsApp action. After enabling `…8786`, labeled Lead
`ISSUE05 ROUTED 20260812 0018` was stored, received exactly one public WhatsApp
action, and appeared assigned to `Primary operator · WhatsApp …8786`. The routing
release-window Vercel error/warning scans were empty. Review found two recoverable
relative-time hydration mismatches in the Lead inbox; `943efbc` stabilizes both
desktop and mobile `<time>` nodes and was revalidated before deployment.

Final production configuration 2026-08-12: the owner supplied the approved number
ending `…7771`. Authenticated `/ops/settings` canonicalized and stored it as
`Secondary operator` with routing disabled. The visible summary reads `1 of 2 enabled
for new Leads`: `…8786` enabled and `…7771` disabled. `/ops/leads` loaded on the
hydration-fix deployment with zero browser console errors. No new Lead or WhatsApp
activation was needed for this configuration check; no full recipient number is
retained in documentation.

Documentation closure: `a2e0240` updates the canonical `README.md`, ADR-0053,
and the tracked Codex↔Cursor shared handoff. It was pushed to `main`; production
deployment `dpl_7SL44zZwYdYiuR4yRGFJccQjKpEd` reached Ready on `zantap.app`.
Post-deploy HTTP checks passed (`/` 200, `/ops/login` 200, unauthenticated
`/ops/settings` expected 307) and the initial Vercel error/warning scans were empty.
