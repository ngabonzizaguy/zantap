# Issue 05 — Ops leads inbox

Status: **ready-for-agent** · Track 1 · ADR-0046 §9 (depends: Issue 04)

- [ ] Control API: `/api/operator/v1/leads` list + status update, `OPERATOR_API_KEY`-guarded, audit-log entries (follow ADR-0039 patterns).
- [ ] `/ops` UI: Leads tab — table (name, type, phone, area, age, status), search, status progression NEW → CONTACTED → ONBOARDED/CLOSED.
- [ ] One-tap `wa.me/<phone>` follow-up link per lead (reuse WhatsApp URL helper).
- [ ] No email automation (none exists; ZanTap business email still undecided — carry the note).
- [ ] Tests + build; ops smoke.
- [ ] Handoff per protocol.
