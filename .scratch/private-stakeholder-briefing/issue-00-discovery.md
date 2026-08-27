# Issue 00 — Private stakeholder briefing discovery

Status: **viewer slice shipped 2026-08-27 · permanent Ops/access backend pending**

Create a mobile-first, protected ZanTap presentation/documentation experience
for interested parties, Vendors, investors, sponsors, and related stakeholders.
It should market ZanTap in clear non-technical language while remaining
substantive enough to function as a project briefing or manual.

## Requested outcome

- [x] Resolve whether this is one universal narrative or audience-specific editions — **one universal experience for every recipient** (owner decision 2026-08-27).
- [x] Resolve the canonical product language — **ZanTap Briefing**.
- [ ] Define the content architecture and claims/evidence boundary; primary CTA resolved as **Express interest** with viewer-type routing.
- [ ] Define expiring access, secret delivery, viewer notice, watermarking, and audit semantics — per-recipient Access grants resolved; expiry/session behavior remains open.
- [x] Define what screenshot deterrence can honestly promise on the web — deterrence and attribution, never guaranteed prevention (ADR-0073).
- [ ] Define ZanTap Ops management workflows and permissions.
- [ ] Define the mobile-first visual/motion direction, including GSAP, Three.js, parallax, reduced motion, and low-data fallbacks.
- [ ] Decide route/host strategy on the existing Vercel account.
- [ ] Produce the PRD, sparse qualifying ADRs, glossary updates, and implementation issues after the interview resolves dependencies.
- [x] Create decision-grade mobile and desktop page designs — implemented and visually QA'd in the live `/briefing` viewer slice.

## Codebase facts established before interview

- ZanTap already has a production marketing root with GSAP, ScrollTrigger,
  Three.js, responsive media safeguards, and the approved brand system.
- `/ops` already has operator authentication and manages marketing-related
  settings/content, so the requested controls should extend Ops rather than
  introduce a parallel admin surface.
- The repository has no existing private presentation/share domain, expiring
  presentation credential, viewer watermark, or briefing analytics model.
- `zantap.app` is the canonical production host on the existing Vercel account;
  a reserved in-app route is the lowest-friction default unless the interview
  identifies a real isolation or branding need for a separate deployment.

## Interview log

### Question 1 — narrative architecture — RESOLVED

**Owner decision (2026-08-27): every recipient sees the same complete
experience.** Ops will not select or maintain separate Vendor, investor/sponsor,
or partner editions. The universal narrative must therefore introduce ZanTap in
plain language, establish the opportunity and credibility, demonstrate the
product, document how participation works, and provide calls to action relevant
to multiple stakeholder types without branching into duplicated presentations.

Rejected recommendation: shared core sections with Ops-selected audience
editions. The owner explicitly chose a single experience for all recipients.

### Question 2 — persuasion versus documentation — RESOLVED

**Owner decision (2026-08-27): cinematic, persuasive story with expandable
evidence and operational detail.** The primary scroll journey should make the
case for ZanTap in clear non-technical language. Supporting proof, definitions,
workflows, safeguards, and manual-like documentation should open in contextual
drawers/panels rather than lengthen the primary narrative for every viewer.

Rejected alternative: a linear comprehensive manual as the main experience.

### Question 3 — primary conversion outcome — RESOLVED

**Owner decision (2026-08-27): one inclusive `Express interest` action.** The
viewer identifies their interest as Vendor, Investor, Sponsor, Partner, or
Other, then provides contact details and a message. Submissions should be
visible and follow-up-ready in Ops. The content remains universal; the interest
type routes the response rather than changing the presentation.

### Question 4 — secret scope and viewer accountability — RESOLVED

**Owner decision (2026-08-27): Ops creates a unique Access grant for each
intended recipient.** Each grant has a human-readable recipient label, generated
secret, independent expiry, revocation state, and view history. Watermarks can
therefore be grant-attributable. Shared campaign/group passwords are rejected.
See ADR-0072 and the `Access grant` definition in `CONTEXT.md`.

### Question 5 — what happens when access expires during viewing — RESOLVED

**Owner chose the recommendation (2026-08-27): enforce expiry immediately.**
When the subtle countdown reaches zero, protected content is removed and the
viewer sees a graceful `Access expired` surface with a renewal request path.
Open tabs do not extend access. Ops can extend or replace the Access grant.
ADR-0072 records the authoritative-expiry consequence.

### Question 6 — default access duration

**Owner accepted the recommendation (2026-08-27):** default new grants to **72
hours**, with Ops presets for 24 hours, 72 hours, 7 days, and a custom date/time.
The operator may edit the expiration after creation; the authoritative immediate
expiry behavior from Question 5 still applies.

### Question 7 — secret delivery

**Owner chose the recommendation (2026-08-27):** Ops generates a copy-ready
**Share kit** containing the presentation link, one-time-visible plaintext
secret, exact expiration, and short confidentiality notice. An Operator
deliberately sends it through a trusted channel such as WhatsApp, email, or in
person. Automatic outbound credential delivery is deferred.

### Question 8 — watermark attribution

**Owner accepted the recommendation (2026-08-27):** the view combines a
low-contrast abstract fingerprint unique to the Access grant with a restrained
changing mark such as `Prepared for {recipient label} · {short grant code} ·
{current time}`. Its position changes subtly to make simple cropping less
effective. ADR-0072 records the attribution/privacy trade-off.

### Question 9 — honest screenshot and sharing controls

**Owner chose the recommendation (2026-08-27):** explicitly promise
**deterrence and attribution, not screenshot prevention**. Use the personalized
watermark, confidentiality acknowledgement, search exclusion, private/no-store
responses, protected media delivery, and no print/download affordances. Do not
break selection, right-click, common keyboard shortcuts, or accessibility with
easily bypassed client blocking. See ADR-0073.

### Question 10 — simultaneous devices

**Owner accepted the recommendation (2026-08-27):** allow at most **two active
Viewing sessions per Access grant**, covering a phone and computer. A third
browser is denied with a neutral `Device limit reached` state and reset request.
Ops can inspect and revoke sessions. See ADR-0072 and `CONTEXT.md`.

### Question 11 — viewer acknowledgement and persistent notice

**Owner accepted the recommendation (2026-08-27):** after entering the secret
on each new device, show `Confidential ZanTap briefing · Prepared for
{recipient} · Expires {date/time} · Do not record or redistribute` with one `I
understand — enter` action. During viewing it collapses into an abstract edge
notice with the recipient mark and live countdown. It does not reappear within
the same active Viewing session. See ADR-0072 and `CONTEXT.md`.

### Question 12 — commercial metrics and evidence

**Owner accepted the recommendation (2026-08-27):** include only an
**Ops-approved, dated evidence snapshot** rather than querying/exposing live
operational data. Ops controls each metric/claim and its `as of` date.

Codebase follow-up: ADR-0046 already fixes the commercial story as free guided
setup for selected early partners and per-order commission as the stated
long-term model. Exact prices remain undefined and must not be invented.

### Question 13 — canonical experience name

**Owner accepted the recommendation (2026-08-27):** the canonical experience
name is **ZanTap Briefing**. `Briefing` covers persuasive presentation, evidence,
operating explanation, and expandable documentation for mixed stakeholders
without reducing it to a fundraising-only deck or technical manual. Added to
`CONTEXT.md`.

### Question 14 — route and deployment boundary

**Owner accepted the recommendation (2026-08-27):** build ZanTap Briefing as a
protected `/briefing` route inside the existing `zantap.app` Next.js deployment.
Reuse the Store seam, Ops authentication/control surface, approved brand assets,
motion libraries, analytics conventions, and Vercel environment. A separate
site/subdomain is rejected for this phase. See ADR-0074.

### Question 15 — primary narrative chapters — RESOLVED WITH REVISION

**Owner decision (2026-08-27): approve the proposed journey except Ops must not
appear whatsoever in the viewer-facing Briefing.** Revised universal journey:

1. **A better way for local food businesses** — vision and invitation.
2. **The problem today** — fragmented messages, payment uncertainty, and
   operational guesswork in plain language.
3. **Meet ZanTap** — one link connecting Customer, payment, and kitchen.
4. **One order, start to finish** — discover → choose → MoMo → kitchen →
   dispatch → repeat.
5. **From Customer to kitchen** — the Customer view and Vendor KDS only,
   without technical architecture language or any Ops reference/screenshot.
6. **Starting a business on ZanTap** — guided setup, menu, brand, and support.
7. **Evidence so far** — Ops-approved dated proof, milestones, and testimonials.
8. **How ZanTap grows** — early-partner offer, long-term per-order commission,
   and Rwanda-first expansion without invented pricing.
9. **Why participation matters** — value for Vendors, partners, sponsors, and
   investors inside the same narrative.
10. **Trust, current boundaries, and roadmap** — what works now, what is interim,
    and what comes next.
11. **Express interest** — viewer type, details, message, and follow-up.

Expandable evidence/documentation panels sit inside chapters 3–10 rather than
forming a separate manual or audience edition.

Viewer-facing exclusion: no Ops chapter, screenshot, label, feature tour,
operator workflow, control-plane explanation, or CTA. Ops is not part of the
marketed product story.

### Question 16 — invisible Ops management boundary

**Owner confirmed the recommendation (2026-08-27): Ops remains the private,
invisible management control plane.** ZanTap Operators manage Access grants,
evidence, content, interest submissions, and audit history through Ops, but the
recipient-facing Briefing never mentions, depicts, or links to Ops.

### Question 17 — visual art direction

**Owner accepted the recommendation (2026-08-27): a dark cinematic editorial
direction:**
warm charcoal/near-black canvas, controlled ZanTap amber light, off-white serif
headlines, real Rwanda/food-business imagery, restrained film grain, and an
abstract grant-derived signal field. It should feel confidential, assured, and
locally grounded—not cyberpunk, a generic glass dashboard, or a conventional
slide deck.

Motion consequence from the consulted premium/mobile/GSAP skills: mobile is a
native vertical composition from 375–390px with no fake horizontal scroll or
custom cursor; desktop may use a small number of deliberate pinned cinematic
chapters. GSAP/ScrollTrigger drives transforms and opacity; Three.js provides
one restrained background signal world rather than many competing canvases;
reduced-motion and low-power modes retain the full narrative as static editorial
compositions.

### Question 18 — imagery authenticity boundary

**Owner accepted the recommendation (2026-08-27):** use real ZanTap product
captures and real/commissioned Rwanda food-business photography wherever the
Briefing makes a factual claim. Generated/abstract imagery is limited to
atmosphere, transitions, texture, or explicitly conceptual future scenes; it
cannot impersonate evidence. See ADR-0075 and `Briefing evidence` in
`CONTEXT.md`.

### Question 19 — launch languages

**Owner accepted the recommendation (2026-08-27):** launch in **English**, with
all narrative/evidence content localization-ready. Add Kinyarwanda and French
only after full human review; never publish unreviewed machine translations of
commercial, security, investment, or confidentiality language.

### Question 20 — Ops editing model

**Owner accepted the recommendation (2026-08-27):** use a **structured
editorial manager** in Ops, not a free-form page builder. Operators manage
chapter copy/order/visibility, approved media, Briefing evidence, and expandable
documentation, then preview and deliberately publish. Layout, typography,
motion, watermarking, access controls, and required trust notices remain
code-governed.

### Question 21 — content version seen by an active grant

**Owner accepted the recommendation (2026-08-27):** every Access grant is
pinned to the published **Briefing version** current at creation. Later
publishing does not silently change active recipient content. Ops may explicitly
move a grant to a newer version or issue a replacement. See ADR-0076 and
`CONTEXT.md`.

### Question 22 — engagement history and privacy boundary

**Owner accepted the recommendation (2026-08-27):** record only purposeful
Briefing activity: successful/failed unlock, session start/end/last seen,
chapter reached, evidence opened, Operator grant/share actions, and Briefing
interest submission, with coarse device/browser data and a privacy-preserving
network fingerprint. Prohibit keystrokes, cursor replay, screen recording,
invasive heatmaps, and unsent form text. See ADR-0077 and `CONTEXT.md`.

### Question 23 — generated secret storage and reset

**Owner accepted the recommendation (2026-08-27):** show plaintext once at
grant creation/reset and in the copyable Share kit; store only a slow password
hash. Ops cannot reveal an old secret. Reset generates a replacement and
immediately invalidates the old secret and every Viewing session. ADR-0072
records the rule.

### Question 24 — generated secret format

Pending owner answer. Recommendation: generate a mobile-friendly secret from
**four unrelated lowercase words plus four digits**, separated by hyphens (for
example only: `velvet-lantern-river-mango-4827`). Accept pasted spaces or hyphens
and ignore letter case. This is substantially easier to read aloud or type from
WhatsApp than a random symbol string while retaining strong entropy when words
come from a large cryptographic list and attempts are rate-limited.

## Implementation pivot and shipped viewer slice

The owner ended the interview after Question 24 was asked and directed immediate
page implementation. Issue 01 shipped the viewer-facing vertical slice as
`dbfaf74` → Production `dpl_CNgdjjhspB7EmWBjxhEW9AxD8hov` → `zantap.app`.
Question 24 is not a permanent-domain decision; the temporary preview uses the
recommended readable format only for this 72-hour review window.

The shipped preview deliberately does not pretend the pending backend exists:
access is an isolated environment secret/cookie seam; interest uses a prepared
email handoff; content is code-defined. Permanent per-recipient grants, Ops
editor/versioning/evidence/activity, and durable interest capture stay pending.

## Notes

- This is discovery/documentation only. No feature implementation, deployment,
  credential generation, or production mutation is authorized in this issue.
- Browser screenshot blocking cannot be guaranteed; the interview must settle
  on honest deterrence and traceability rather than an absolute promise.
