# ADR-0026: Post-launch optional storefront checklist

Date: 2026-07-01
Status: Accepted (candidate #16, Issue 4 — implements grill decision 6)

## Context

Candidate #16's mockup ends with an optional "keep improving your storefront"
checklist (`design-assets/UI-screens/KDS-onboarding-optional-checklist.png`) — a
"0 of 8" screen listing Logo, Cover, Business Hours, Menu Photos, Ingredients,
Delivery Zones, Estimated Prep Time, Business Description, and Social Links. Grill
decision 6 scoped this pass to: build the checklist UI wired into the existing KDS
Setup drawer, and add only the three core Vendor fields that already exist in the
schema from Issue 1 (`logoUrl`, `coverImageUrl`, `description`). Business hours,
delivery zones, prep time, and social links are a follow-up epic (no new schema).

The getting-started checklist (`ONBOARDING_STEPS` in `lib/vendor/onboarding.ts`)
is a separate, order-blocking-adjacent guide; this optional checklist is
strictly post-launch polish.

## Decision

1. **New pure derivation module `lib/vendor/optional-checklist.ts`** — separate
   from `onboarding.ts`. It exports `OPTIONAL_CHECKLIST_ITEMS` (all nine rows in
   mockup order), `deriveOptionalChecklist(vendor, menu)` (pure, client- and
   server-safe), and `countOptionalCompleted(state)`. Completion reads from the
   persisted Vendor fields (`logoUrl`, `coverImageUrl`, `description`, trimmed) and
   the hydrated menu (`menuPhotos` = any item with an image, reusing the existing
   MenuImage gallery).

2. **Only three fields are wired this pass; the rest render `comingSoon`.**
   Actionable rows: **Logo**, **Cover**, **Menu Photos**, **Business Description**.
   The remaining five — **Business Hours**, **Ingredients**, **Delivery Zones**,
   **Estimated Prep Time**, **Social Links** — carry a `comingSoon: true` flag,
   render disabled with a "Soon" badge, and are **excluded from the progress
   count**. This is a deliberate deviation from the mockup's literal "0 of 8": the
   counter reflects only genuinely completable items ("X of 4") so a vendor can
   actually reach 100%. Ingredients is grouped with the deferred set (not the
   grill's "existing customization" mapping) because no per-item ingredients editor
   exists yet — the future "real modifiers" epic (#14 follow-up) owns it; keeping it
   actionable would strand the counter permanently below 100%.

3. **Logo / cover / description are edited as text in the Setup drawer profile
   editor, not uploaded.** `logoUrl` and `coverImageUrl` are URL inputs (same
   `https://…` validation as the menu "Add URL" path); `description` is a textarea.
   No vendor-level Blob upload action is added — that would be new server/infra
   surface beyond "wire the three fields." Persisted via the existing
   `updateVendorProfile` owner-token-guarded action, extended to forward the three
   fields (still a single async `"use server"` export — no type re-export).

4. **The checklist derives from the saved `profile` prop, not draft state.** The
   Setup drawer already lifts saved values up through `onProfileSaved` →
   `KdsDashboard.storefrontProfile` → back down as `profile`. Deriving the optional
   checklist from `profile` + `menu` (both passed into `SetupDrawer`) means a row
   ticks only after a successful save round-trips, and updates reactively via SSE
   menu changes.

## Consequences

- Adds no schema, no migration, no new server action, no Blob dependency.
  `updateVendorProfile` gains three optional passthrough fields; the Store already
  persisted them since Issue 1 (both adapters + contract test 153).
- `StorefrontProfile` (the `SetupDrawer` prop type) gains `logoUrl`,
  `coverImageUrl`, `description`; `SetupDrawer` gains a required `menu` prop.
  `KdsDashboard` is the only renderer and is updated accordingly.
- The four deferred capabilities (hours, zones, prep time, social) and Ingredients
  remain visible as "Soon" rows — they signpost the roadmap without pretending to
  be actionable. When the follow-up epic lands, flip `comingSoon` and add
  derivation/editors; the progress total moves automatically.
- Logo/cover are storefront-facing fields the customer storefront does not yet
  render — this pass only makes them editable + tracked. Rendering them on the
  customer menu is left to the deferred customer-storefront-redesign work
  (candidate #10), consistent with grill decision 6 ("add fields, not rendering").

## Alternatives considered

- **Count all nine rows ("X of 9") to match the mockup.** Rejected — five rows are
  not completable this pass, so the bar could never fill; honesty over pixel
  fidelity.
- **Blob upload for logo/cover (mockup "Add" buttons imply file upload).**
  Rejected this pass — a vendor-level upload action is new infra beyond the three
  scoped fields; URL inputs match the existing menu-image URL pattern and the
  schema fields. A follow-up can add upload without changing the checklist model.
- **Reuse `ONBOARDING_STEPS` / `OnboardingChecklist`.** Rejected — different
  lifecycle (post-launch polish vs. getting-started) and different completion
  sources; a separate module keeps both derivations pure and independently tested.
