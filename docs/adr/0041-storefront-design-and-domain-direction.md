# ADR-0041: Storefront DESIGN.md migration and TBD public domain

Date: 2026-07-07
Status: Accepted
Builds on: ADR-0005 (DESIGN.md), ADR-0032 (`lib/base-url.ts`), ADR-0040 (#12 deferred)

## Context

Candidate #10 (customer storefront → DESIGN.md) was blocked on owner-supplied designs.
The owner will purchase a new public domain (replacing the provisional `zantap.ai`
display URL). They directed that the storefront visual migration use the **ElevenLabs
editorial design system** already codified in `DESIGN.md` — the same system used for
KDS shell (light) and Ops UI.

## Decision

1. **#10 is unblocked.** Design authority = `DESIGN.md` + existing Tailwind tokens and
   UI primitives. No external mockup gate.

2. **Customer vs vendor separation unchanged.** Only `/[slug]` customer surfaces migrate
   off `zt-*`; `/vendor/[slug]` retains `.kds-dark` operational theme (ADR-0017).

3. **Behavior preserved.** Cart, checkout, manual MoMo USSD, customize notes, share,
   and lightbox flows are token/styling changes only — no Store or payment seam edits
   in this candidate.

4. **Public domain TBD.** When the new domain is mapped on Vercel:
   - Set `NEXT_PUBLIC_BASE_URL` to the new HTTPS origin.
   - Set `ZANTAP_OPERATOR_API_URL` to `https://<host>/api/operator/v1` for co-located Ops.
   - Remove or repoint any stale `zantap.ai` Production env if unused.

5. **Auth out of scope.** Candidate #12 remains deferred; no customer or vendor login
   introduced by #10.

## Consequences

- Next engineering work can slice #10 vertically without waiting on design assets.
- Display copy and share URLs follow `getBaseUrl()` once env is updated at cutover.
- After full migration, `zt` palette block may be removed from `tailwind.config.ts`
  (mirror ADR-0016 `zk-*` removal). **Done 2026-07-07** — see ADR-0042.

## Alternatives considered

- **Wait for custom owner mockups** — rejected; ElevenLabs system is sufficient.
- **Keep `zantap.ai` as production domain** — rejected; owner buying a new domain.
