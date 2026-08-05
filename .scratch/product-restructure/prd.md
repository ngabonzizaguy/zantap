# PRD — ZanTap launch restructure (from ADR-0046)

Status: **ready-for-agent** · Branch: `product/restructure-audit` · Date: 2026-08-05

Source of truth for every decision below: `docs/adr/0046-restructure-decisions-owner-interview.md`
(16-question owner interview). Audit evidence: `.scratch/product-architecture-audit/audit-2026-08-05.md`.
Landing design reference: `.scratch/lead-funnel-prototype/` (final verdict: C structure + A hero).

## 1. Objective

Recruit real Kigali food-business partners within 90 days. The product loop
(onboard → storefront → checkout → KDS → dispatch) already works; this PRD
covers only what stands between that loop and safe public acquisition.

## 2. Offer and positioning (fixed copy constraints)

- Offer: **free guided setup for selected early partners**; per-order commission
  is the stated long-term model. Copy may say "free"; must not invent prices.
- Audience: **any local food business** (small restaurants, bars, caterers,
  home-based delivery) — never "restaurants only." Rwanda-first, East-Africa-ready.
- Language: English-only, but no hard-coded strings inside new components —
  copy lives in module-level constants/dictionaries so Kinyarwanda/French are
  later translation tasks (ADR-0046 §14).

## 3. Scope — four tracks, in ship order (ADR-0046 §15)

### Track 1 — Brand + domain + production lead funnel (ships first)

1. **Z brand rollout in-product**: `public/brand/approved-z/` replaces the
   circular medallion everywhere — favicon set, app icons, onboarding splash,
   "You're Live" hero, KDS `MetricsBanner` header. Medallion assets retired.
2. **`zantap.app` cutover** (blocked on owner purchase): Vercel domain mapping,
   `NEXT_PUBLIC_BASE_URL=https://zantap.app`, `ZANTAP_OPERATOR_API_URL` update,
   doc sweep of `zantap.ai` references.
3. **Production marketing page at `/`** replacing the demo-storefront redirect:
   C's conversion-first structure (offer + visible lead form) + A's cinematic
   Kigali hero (still + 5s muted loop, assets already in
   `.scratch/lead-funnel-prototype/assets/`). Device-framed real screenshots
   (no floating screenshot cards; no screens exposing customer/driver phones).
   SEO fundamentals: metadata, Open Graph, sitemap/robots for the marketing page.
   **Motion stack (owner directive 2026-08-05, ADR-0047):** GSAP smooth
   animations, restrained Three.js detail, Higgsfield-generated assets, and a
   scroll-scrubbed cinematic built with the installed **scroll-world** skill
   (`.agents/skills/scroll-world/`) — its own owner interview + budget approval
   precede any paid rendering; conversion (lead form) always wins over
   cinematic; reduced-motion/still fallbacks mandatory. Details in issue-03.
4. **Durable lead capture**: `Lead` model through the Store seam (both adapters
   + migration), server action with validation + basic rate limit + consent
   line, no client DB access.
5. **Ops leads inbox**: leads list in `/ops` with status progression
   (new → contacted → onboarded/closed), search, and audit-log entries.
   Follow-up channel is the owner's WhatsApp/call — no email automation.

### Track 2 — Trust hardening (before the first stranger vendor)

6. **Operator-gated recovery**: remove self-serve slug+phone token reissue.
   Public "Recover access" becomes a request that lands in the ops recovery
   inbox; the operator verifies a human and reissues from `/ops` (verbs exist).
7. **Vendor payment-verification state**: manual-MoMo orders arrive on the KDS
   as "customer says paid" (unverified); a vendor action marks them verified
   after checking the MoMo statement. KDS badge + filter distinguish the two.
   Simulated-MoMo orders remain verified-on-payment. Never render an
   unqualified "PAID" for unverified manual payments.

### Track 3 — Design authority

8. **`DESIGN.md` rewrite**: codify what is live — one brand foundation (Z mark,
   amber, typography) with intentional per-surface treatments: marketing (new),
   dark liquid-glass storefront (ADR-0043), dark KDS/onboarding (ADR-0017/0025),
   ops. No live surface gets repainted. Supersede stale light-editorial claims;
   document the "Kitchen Dashboard" (public copy) vs "KDS" (internal) rule.

### Track 4 — PWA + vendor hours

9. **PWA baseline**: manifest (Z icons), installability (KDS on kitchen
   tablets is a sales point), service worker with read-only cached shell,
   explicit offline states. Never cache or queue payments/privileged writes.
10. **Offline kitchen-stage queue**: queue ONLY accept/preparing/ready stage
    moves while offline; server-state-wins on replay; visible
    "failed to sync" state. Nothing else queues (ADR-0046 §11).
11. **KDS new-order chime**: audible alert while the KDS is open (pilot
    notification model). Push/WhatsApp auto-notify is out of scope.
12. **Vendor hours/open-state**: schema + Setup editor + storefront
    closed-state + checkout block when closed. (Delivery zones & fees are the
    next field after this; not in this PRD.)

## 3b. Design/UI skill toolkit (owner directive 2026-08-05 — vendored in `.agents/skills/`)

Implementing sessions MUST consult the relevant vendored skills before building UI:

| Skill | Use for |
|---|---|
| `ui-ux-pro-max` | Every UI task (issues 03, 09, 10 + any surface work): run its searchable design-system/UX-guideline queries (Python, self-contained). Its priority table (accessibility → touch → performance) matches our mobile-first constraints. |
| `gsap-core`, `gsap-scrolltrigger`, `gsap-react`, `gsap-timeline`, `gsap-performance` (+ `gsap-plugins`/`gsap-utils`/`gsap-frameworks` as needed) | Official GSAP skills — all GSAP work on the landing page (issue 03, ADR-0047). React/Next usage goes through `gsap-react`. |
| `premium-frontend-ui` | Landing page (issue 03): award-level polish standards; pick the "Cinematic Pacing" identity — it matches C+A. |
| `mobile-app-ui-design` | PWA/app surfaces (issues 09, 10) + mobile-first landing: native-feeling mobile patterns, touch/safe-area/nav conventions. |
| `scroll-world` | Landing scroll cinematic (issue 03, ADR-0047 guardrails: owner budget approval before paid rendering). |
| `frontend-design` (Anthropic, installed machine-wide) | General frontend craft on any new surface. |

Evaluated and **rejected** (do not install/use): `shadcn` skill (we hand-build
primitives from DESIGN.md — no competing component system), `minimalist-ui`
(bans Inter + glassmorphism, contradicting the live dark liquid-glass system),
`material-3-skill` (ZanTap is deliberately not Material), `awesome-design-skills`
(a catalog, not a skill — browse it only when hunting for something specific).
**Authority order on any conflict: DESIGN.md/ADR-0043/0046/0047 > skill advice.**

## 4. Non-goals (explicitly deferred by the owner)

Live MoMo API integration; vendor accounts/roles/sessions; web push; driver
app/presence/tracking; delivery zones & fees; menu modifiers/ingredients;
Kinyarwanda/French translations; email automation; multi-country expansion;
pricing/entitlement enforcement.

## 5. Risks and coordination

- **Parallel Codex agent** works in worktree `zantap-codex-direction-a` on
  branch `codex/direction-a-independent`, forked BEFORE ADR-0046 — it may
  produce a Direction-A-only funnel with pre-decision copy. Owner arbitrates;
  this PRD follows ADR-0046. Shared-file conflict surfaces if merged:
  `app/page.tsx`/root route, `.scratch/architecture-candidates.md`,
  lead-funnel prototype files, brand assets.
- `zantap.app` purchase is owner-blocked; funnel can ship on the Vercel alias
  and cut over later, but QR/printed material must wait for the domain.
- Track 2 must land before promoting the funnel broadly (ADR-0046 §15).

## 6. Acceptance (per track)

- T1: `/` serves the funnel (no demo redirect); a submitted lead persists to
  Postgres and appears in `/ops`; Z mark everywhere; Lighthouse SEO pass.
- T2: no code path reissues a token without an operator action; a manual-MoMo
  order can never display as verified-paid without the vendor action.
- T3: `DESIGN.md` matches the live product; contradictions with ADR-0043/0017
  resolved in writing.
- T4: installable on Android Chrome; airplane-mode KDS shows cached shell +
  clear offline state; stage moves made offline replay with server-wins; a
  closed vendor's storefront blocks checkout.

Issues: `issue-01.md` … `issue-10.md` in this folder — one issue per session,
each independently shippable, in PRD order.
