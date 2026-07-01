# Pooler egress audit & fix

**Status:** ✅ Done — Phase 2 shipped 2026-07-01 (ADR-0023)

## Problem

~1.1 GB/day Supabase Shared Pooler Egress (Free plan). Prisma on `DATABASE_URL`
(6543), not PostgREST.

## Phase 1 findings (ranked)

- [x] **#1 KDS SSE** — 1 Hz full `fetchKdsSnapshot` per tab (fixed)
- [x] **#2 Unbounded `listOrders`** on KDS path (fixed → `listKdsOrders`)
- [x] **#3 Deep `orderInclude` on polls** (fixed → `kdsOrderInclude`)
- [ ] **#4 Onboarding checklist** — still `listOrders`; user-triggered only
- [ ] **#5 `createOrder` full menu fetch** — low frequency; deferred
- [x] **#8 Seed guard** — remote Supabase refused unless `SEED_ALLOW_REMOTE=1`

## Phase 2 checklist

- [x] `getKdsSnapshotRevision` + revision-first SSE poll
- [x] `listKdsOrders` with today roll-off for COMPLETED
- [x] Narrow KDS order includes
- [x] Fingerprint includes `kitchenStage`
- [x] Seed remote guard + `.env.example`
- [x] ADR-0023

## Verify after deploy

- Open KDS tab idle 5 min — Supabase pooler egress should stay flat
- Pay order — ticket appears within ~1s
- Kitchen stage advance — SSE push within ~1s
- History tab — paginated export unchanged
