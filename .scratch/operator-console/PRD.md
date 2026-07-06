# PRD — ZanTap Operator Console (Candidate #17)

## Goal

Give ZanTap platform operators full cross-vendor control: directory, suspend/reactivate, profile/menu/order overrides, recovery inbox, owner-token revoke/reissue, and audit — via a separate `/ops` UI backed by a versioned Control API extractable to its own deployment later.

## Actors

- **Operator** — ZanTap staff using `/ops`
- **Vendor** — unchanged KDS/storefront flows; sees suspended banner when halted
- **Customer** — blocked checkout when vendor suspended

## Architecture

- **Control plane (Zantap):** `lib/operator-control/`, `app/api/operator/v1/*`, Store operator verbs, halting enforcement
- **Ops plane:** `app/ops/`, `components/ops/`, `lib/operator-client/` — no Store imports

## MVP (Phase 1)

- Control API: list vendors, get detail, suspend, reactivate
- Halting: suspended storefront page, reject `placeOrder` / manual payment confirm
- Ops UI: login, directory, suspend/reactivate with confirm modal

## Phase 2

- Recovery inbox, token revoke/reissue, review workflow

## Phase 3

- Vendor detail tabs: profile, menu, orders, audit overrides

## Phase 4

- Playwright smoke (1280×800 + 390×844), env docs, extraction checklist

## Env vars

| Var | Where | Purpose |
|---|---|---|
| `OPERATOR_API_KEY` | Zantap + Ops server | Control API Bearer auth |
| `OPERATOR_UI_SECRET` | Ops login | UI session gate |
| `ZANTAP_OPERATOR_API_URL` | Ops (optional) | Defaults to same-origin `/api/operator/v1` |
| `OPS_APP_URL` | Zantap (optional) | CORS allowlist when Ops split |

## Out of scope v1

- Separate Ops repo deploy
- Ops Supabase operator accounts (#12)
- Automated fraud detection
