# ADR-0025: Dark self-serve onboarding wizard UI

Date: 2026-07-01
Status: Accepted (implements ADR-0022 for the client surface — candidate #16, Issue 3)

## Context

ADR-0022 set the policy (gate-free self-serve, per-vendor owner token, non-halting
phone recovery) and ADR-0024 built the server surface (Issue 2). Issue 3 rebuilds
the `/onboard` UI as the dark, mobile-first, self-serve wizard from
`design-assets/UI-screens/*` (7 surfaces) and removes the interim bridges Issue 2
left in place. This ADR records the client-side decisions that were open.

## Decision

1. **Rebuilt `/onboard` as a `.kds-dark`, mobile-first step machine.**
   `OnboardWizard` owns one `WizardData` object and a `WizardStep` union:
   splash → business → payments → menu → review → live. The four middle steps
   render the shared `WizardProgress` header ("Step N of 6", matching the
   mockups); splash and live do not. The whole tree is wrapped in a single
   `.kds-dark` container so the ADR-0017 token remap applies (the customer
   storefront stays light). New step components live under
   `components/onboard/steps/*`; `GateStep`, `OperatorContact`, `FirstDishStep`,
   `SuccessStep`, `is-provision-enabled.ts`, and `useProvisionSecret.ts` are
   deleted.

2. **The page gate is gone.** `app/onboard/page.tsx` no longer branches on
   `isProvisionEnabled()` / `PROVISION_SECRET`; it renders the wizard
   unconditionally. Signup is closed only server-side via `PROVISION_KILL_SWITCH`
   (enforced inside `provisionVendor`, ADR-0024). This completes the prod cutover
   note in ADR-0024: `PROVISION_SECRET` no longer has any code path, and
   `VENDOR_WRITE_SECRET` was already dead.

3. **No server change — the starter category + photo persist post-provision.**
   `provisionVendor` (frozen from Issue 2) creates the starter item as `General`
   and cannot take a photo (no vendor/item exists mid-wizard, decision 7). On the
   "You're Live" screen, after `cacheOwnerToken`, the wizard finalizes by calling
   the existing guarded actions with the just-minted token: `updateMenuItem` to
   set the chosen menu category (when it differs from `General`) and
   `uploadMenuImage` for the optional first-dish photo. Both are best-effort /
   non-fatal — the store is already live if they fail (the vendor can fix either
   from the KDS Menu tab). This keeps Issue 3 strictly client-side and honours
   "one issue per session" (no `"use server"` signature change).

4. **`payoutMethod = PHONE` stores the payout phone in `momoCode`.** The Vendor
   schema + `provisionVendor` validation require a non-empty `momoCode`. For the
   "Receive to Phone Number" option there is no merchant code, so the entered
   payout phone is written to `momoCode` (the MoMo account identifier), while
   `payoutMethod` records the intent. The business-step phone (`phoneNumber`) is
   the separate signup/contact number used for recovery — the two are not
   conflated. Real payout routing remains deferred (decision 5).

5. **Recovery UI is a dialog reachable two ways.** `RecoverAccessDialog`
   (slug + signup phone → `recoverOwnerToken`) opens from the splash
   ("Already have a store? Recover access") and via the deep link
   `/onboard?recover=1` (read from `window.location` in an effect to avoid a
   `useSearchParams` Suspense boundary). On success it `cacheOwnerToken`s the
   re-issued token and links to the KDS — zero typing, matching ADR-0022's
   "never prompt." The interim manual owner-token paste field in
   `SetupDrawer` is removed; that section now shows an unlocked/locked chip and,
   when locked, a "Recover access" link. `useOwnerToken` still never prompts.

6. **QR + confetti.** The storefront QR uses `qrcode.react` (`QRCodeSVG`, added
   as a dependency) rendered on a white plate so it stays scannable inside the
   dark screen. Confetti is dependency-free (CSS keyframe in `globals.css`,
   seeded on mount so it never causes an SSR hydration mismatch); all wizard
   motion is disabled under `prefers-reduced-motion`.

## Consequences

- `PROVISION_SECRET` can be removed from Vercel (no code reads it). Leave
  `PROVISION_KILL_SWITCH` unset to keep signup open (ADR-0024 cutover).
- The category/photo finalize adds up to two extra guarded calls on the Live
  screen. They go through the existing Store seam (no new data path) and are
  swallowed on failure, so they cannot block go-live.
- A vendor choosing "Receive to Phone" whose payout phone differs from their
  signup phone will still recover using the *signup* phone — the recovery
  matcher reads `Vendor.phoneNumber`, not `momoCode`.
- `qrcode.react` is a small client-only dependency; no server bundle impact.
- Repo-wide `react-hooks/set-state-in-effect` lint errors are pre-existing and
  not part of the passing bar (build + test); the new steps follow the same
  established effect pattern. `npm run build` clean; `npm test` 174 passed /
  64 skipped (the 2 skipped files are the opt-in remote `#prisma` suite).

## Alternatives considered

- **Extend `provisionVendor` to take the category/photo** — correct data in one
  call, but changes a frozen `"use server"` action (Issue 2 scope) and its test;
  rejected in favour of the client-side post-provision finalize.
- **Separate payout-phone field on Vendor** — cleaner modelling, but a schema
  change is out of Issue 3 scope; reusing `momoCode` matches the sim's existing
  meaning and defers real payout routing (decision 5).
- **`useSearchParams` for the recover deep link** — idiomatic, but forces a
  Suspense boundary on the route; the `window.location` effect is simpler for a
  client-only wizard.
