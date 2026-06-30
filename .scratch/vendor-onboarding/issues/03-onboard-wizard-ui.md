# Onboard wizard UI — /onboard provisioning flow

Status: done 2026-06-30

## Parent

PRD: `.scratch/vendor-onboarding/PRD.md`  
Flow: `.scratch/vendor-onboarding/FLOW.md`  
ADR: `docs/adr/0020-vendor-provisioning-store-create-vendor.md`

## Scope (one session)

Browser wizard at `/onboard` for Layer A onboarding: provision secret gate, business
identity, first dish, success handoff. Uses **DESIGN.md light editorial** tokens (not
`.kds-dark`).

## What to build

### Route

- `app/onboard/page.tsx` — client wizard shell or RSC + client steps
- Optional `app/onboard/layout.tsx` — minimal canvas + `GradientOrbs`

### Steps (see FLOW.md)

| Step | Fields | Actions |
|------|--------|---------|
| 0 Gate | `provisionSecret` | Save to `sessionStorage`; skip if env unset (dev) |
| 1 Business | `name`, `slug`, `phoneNumber`, `momoCode` | Debounced `checkSlugAvailable` on slug |
| 2 First dish | `name`, `priceRwf` | Required |
| 3 Success | — | Links to `/{slug}` and `/vendor/{slug}?tab=setup` |

### Slug UX

- Auto-generate from name on blur (`slugify` client helper matching server normalization)
- Show live URL preview: `{origin}/{slug}`
- States: checking / available / taken

### Submit

- Call `provisionVendor(secret, vendorInput, starterItem)` from step 2 CTA
- Loading + error surfaces (duplicate slug, bad secret, network)
- On success → step 3

### Components (suggested)

- `components/onboard/OnboardWizard.tsx`
- `components/onboard/steps/GateStep.tsx`, `BusinessStep.tsx`, `FirstDishStep.tsx`,
  `SuccessStep.tsx`
- Reuse primitive kit: `Button`, `Input`, `Card`

### Fail closed

When `PROVISION_SECRET` unset at runtime (server check via small helper or action error):
render operator-contact message instead of wizard — do not allow unguarded prod signup.

## Files touched

| Area | Paths |
|------|-------|
| Route | `app/onboard/page.tsx`, optional `layout.tsx` |
| UI | `components/onboard/**` (new) |
| Client helper | `lib/vendor/slug.ts` (reuse from issue 01) |

**Avoid:** Store interface changes, KDS checklist changes, write-secret UI.

## Acceptance criteria

- [x] Full wizard completes against dev/in-memory or local DB
- [x] Created vendor reachable at `/{slug}` with one menu item
- [x] Success CTA opens KDS Setup tab
- [x] Mobile-first (375px); DESIGN.md tokens; no `zt-*` / `kds-dark`
- [x] `npm run build` passes

## Test plan

1. `npm run build`
2. **Manual dev smoke:**
   - Set `PROVISION_SECRET` in `.env`
   - Complete wizard → storefront shows name + dish
   - KDS `?tab=setup` → checklist shows menu item step complete
   - Place MoMo sim order → appears on KDS

## Blocked by

- Issue 02 (`provision-actions-and-guard`)

## Unblocks

- Issue 04 (`kds-setup-profile-and-copy`) — can run in parallel after 01 if profile
  uses `updateVendor` only

## Comments
