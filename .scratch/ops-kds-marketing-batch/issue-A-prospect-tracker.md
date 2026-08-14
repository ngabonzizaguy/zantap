# Issue A â€” Ops Prospect tracker

**Status:** DONE · SHIPPED 2026-08-14 (`7d87984` → main → `zantap-ozp9b64ja` → `zantap.app`; migration applied; prod smoke PASS)  
**Branch:** `feat/ops-kds-marketing-batch`  
**ADR:** 0054

## Goal

Outbound business outreach tracker in `/ops`, separate from inbound Leads.

## Checklist

- [x] `Prospect` + `ProspectInteraction` Prisma models + migration
- [x] Domain types in `lib/prospects/`
- [x] Store verbs (both adapters) + contract tests
- [x] Operator API `/api/operator/v1/prospects`
- [x] Ops UI tab: pipeline list, quick-add, bulk paste, interaction log, convert link
- [x] Sidebar nav entry in `OpsShell`

## Locked decisions

- Stages: FOUND â†’ CONTACTED â†’ IN TALKS â†’ CONVERTED; exits DECLINED, UNREACHABLE
- Manual entry + bulk paste/CSV; no Maps/social integrations in v1
- Full interaction log (date, channel, note)
- Manual link to Vendor (optional Lead) on conversion
- Sort by next-follow-up due
