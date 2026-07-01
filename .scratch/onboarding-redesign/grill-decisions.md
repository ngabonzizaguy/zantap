# Onboarding redesign — grill decisions (candidate #16)

Grilled 2026-07-01 via `/grill-with-docs` (grilling + domain-modeling skills).
Extends candidate #15 (`.scratch/vendor-onboarding/`). Branch: `feat/onboarding-redesign`.

Design source: `design-assets/ZanTap Onboarding (standalone).html` (escaped single-string
design-tool export — not runnable) + 7 rendered screens in `design-assets/UI-screens/`.

## The new flow (from the mockups)

Dark `.kds-dark` theme, momo-orange accent (`#F5A623`), mobile-first, ~6 steps + splash + optional checklist:

| # | Screen | Content |
|---|--------|---------|
| 0 | Splash | "Start accepting orders in under one minute." Role wheel. CTA **Get Started** |
| 1 | Business essentials | Name · Storefront URL w/ **live slug availability** · Phone (country picker) · **Business Category** |
| 2 | Payments | Radio: **MoMo Merchant Code** *or* **Receive to Phone Number** (+ validation) |
| 3 | Quick Menu | First dish: Name · Price RWF · Category · **Photo (optional)** · **Live Preview** |
| 4 | Review & Confirm | Editable cards (Restaurant / Payments / Menu) → **Go Live** |
| 5 | You're Live | Confetti · storefront URL · **QR code** · Share / Copy · **Open Kitchen Dashboard** |
| 6 | Optional checklist | Post-launch "0 of 8": Logo, Cover, Hours, Menu Photos, Ingredients, Delivery Zones, Prep Time, Description, Social Links |

## Decisions (locked)

1. **Repo strategy → new feature branch in THIS repo** (`feat/onboarding-redesign`), NOT a separate
   repo/monorepo. Onboarding must call the existing Store seam, Server Actions, Prisma schema, and
   DESIGN/`.kds-dark` tokens; one Store, one Prisma, one deploy pipeline.
2. **Replace `/onboard` in place** — one onboarding surface. Reuse/extend `provisionVendor` + Store.
   No parallel route, no feature flag.
3. **Drop the provision-secret gate → open self-serve signup.** No gate screen; wizard opens on the
   splash. GUARDRAIL: keep `PROVISION_SECRET` as an *optional server-side kill-switch* (env toggle,
   off by default) + basic rate-limiting on `provisionVendor`, since we're removing the only public
   abuse barrier before real auth.
4. **Theme → adopt `.kds-dark` for the whole flow** (ADR-0017). Vendor-facing; ends at "Open Kitchen
   Dashboard." Not the light editorial storefront theme the current `/onboard` uses.
5. **Payout method → stored preference.** Add `payoutMethod` enum (`MERCHANT_CODE` | `PHONE`) to Vendor.
   MoMo sim behavior unchanged; we record intent + show the right field. Real payout routing deferred.
6. **Checklist scope → build UI + wire to existing KDS Setup drawer; add only core missing fields.**
   New Vendor fields THIS pass: `businessCategory`, `payoutMethod`, `logoUrl`, `coverImageUrl`,
   `description`. Defer: business hours, delivery zones, estimated prep time, social links (follow-up epic).
   Menu Photos = existing MenuImage gallery; Ingredients = existing customization; tagline exists.
7. **First-dish photo → optional, uploaded AFTER provisioning.** Provision vendor + dish first; if a
   photo was chosen, upload it in a second step keyed to the new menu item. No mid-wizard upload
   (no vendor/menu item/secret exists yet). Checklist "Menu Photos" is the primary photo path.
8. **Write guard → retire the shared write-secret; auto-issue a per-vendor owner token.**
   Onboarding is gate-free regardless. For mutating an ALREADY-LIVE vendor (menu edit/delete, media
   upload): mint a per-vendor owner token at provision, cache in browser, never typed. Zero friction,
   AND blocks strangers from editing someone else's store (strictly better than today's shared secret,
   which gives no per-vendor isolation). Supersedes ADR-0009. Real auth (#12) still future.
9. **Recovery → phone-based, non-halting (never locked out).** A "Recover access" form takes the
   storefront URL (slug) + signup phone number; on match the server **immediately re-issues** the owner
   token. No OTP. Recovery MUST NOT block the vendor — they resume work instantly. Each recovery emits a
   **recovery event** logged server-side so the future ZanTap admin panel can run async verification
   (WhatsApp message or a triggered KDS verification modal) without halting access. Pre-launch stopgap;
   hardened at launch.
10. **No existing public vendors → no backfill.** The only vendor is a personal test vendor. The schema
    migration resets/re-seeds it (mint a fresh owner token); no client migration, no re-provisioning of
    live users.

## Deferred to a later grill (owner will direct)

Ask #3 "features that cap off the platform for launch" — parked. Owner said they'll plan carefully
and direct sequencing. Roadmap candidates surfaced (each gets its own `/grill-with-docs`): public
landing page, real MTN MoMo callback (#11), WhatsApp PAID notify (#9), real modifiers epic, vendor
analytics, public directory, real auth (#12).

**ZanTap operator/admin panel (owner's design, deferred).** System-of-record for every vendor's
details; consumes the recovery events from decision 9. On a recovery / new-device trigger (fires on
both vendor + admin side), the operator reviews current-vs-original details asynchronously and chooses
to verify via WhatsApp or a triggered KDS verification modal — never halting the vendor. This is the
long-term replacement for the phone-based recovery stopgap and a precursor to real auth (#12).
Registered as candidate #17.

## Domain-model notes

- New term candidate: **Owner token** (per-vendor capability token minted at provision, browser-cached,
  never typed; replaces the shared Write-secret). Update `CONTEXT.md` when implemented.
- Update the **Write-secret** glossary entry to reflect retirement in favour of the owner token.
- New Vendor attributes: `businessCategory`, `payoutMethod`, `logoUrl`, `coverImageUrl`, `description`.
