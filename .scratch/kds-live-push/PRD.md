# PRD: KDS live push (SSE)

Status: done  
Feature slug: kds-live-push  
Source: architecture candidate #4

## Problem

The KDS polled `loadKdsSnapshot` every 5s. Correctness was fixed by candidate
#1 (reads through Store), but UX latency and per-tab poll churn remained.

## Solution

SSE stream at `/api/vendor/[slug]/kds-stream` pushes snapshot updates when the
Store changes. Client subscribes via `useKdsLiveSnapshot`; vendor mutations still
call `loadKdsSnapshot` for immediate local feedback.

## Out of scope

- Auth on KDS route
- WebSocket upgrade
- Sub-second DB NOTIFY / external pub-sub
- Connection status UI in the KDS chrome

## Acceptance

- [x] No client `setInterval` poll in `KdsDashboard`
- [x] SSE reads through `fetchKdsSnapshot` (Store seam)
- [x] Fingerprint skips redundant frames
- [x] `npm test` green
- [x] ADR-0002 recorded
