# ADR-0058: Scene 03 payment-success UI image gate

Date: 2026-08-14

Status: Accepted; attempt 1 owner-approved, no retry submitted, Cursor integration complete (2026-08-14)

## Context

The current Scene 03/06 still correctly depicts a photoreal Kigali restaurant payment-and-food-handoff moment, but the phone carries an abstract blank amber screen. The owner marked that screen for correction and supplied the real `successful-payment.png` UI. Cursor will integrate the eventual accepted image with its other marketing corrections; Codex is responsible only for the gated Higgsfield image generation.

## Decision

1. Use `public/marketing/scroll/momo.webp` as the first reference and exact composition master.
2. Use `public/brand/UI-screens/new-UI-screens & video walkthrough/successful-payment.png` as the second reference and exact phone-screen UI source.
3. Preserve every part of the first reference except the phone display. Perspective-match the second reference into the existing tilted phone glass, keep the thumb in natural contact with the lower screen, and preserve the successful-payment hierarchy without invented UI.
4. Match the original still generation settings recorded in `.scratch/product-restructure/scroll-world/still_momo.json`: GPT Image 2, 3:2, 2K, High, one result.
5. Upload nothing and submit no generation until the owner approves the exact prompt, two references, settings, and one-generation action recorded in `.scratch/ops-kds-marketing-batch/shot-list-scenes-2-4.md`.
6. After approval, submit exactly once, review the result with the owner, and obtain a new approval before any retry. Return the image only; do not integrate it into the page.

## Budget

- Confirmed current balance: 93.72 credits.
- Read-only Higgsfield estimate: exactly 7 credits for one GPT Image 2, 3:2, 2K, High result.
- Projected balance after one approved generation: 86.72 credits.
- Free-trial/unlimited generation is unavailable.

## Consequences

- This is a low-cost image correction, not another video generation.
- Scene 03 composition and visual continuity remain stable while the phone communicates the real ZanTap successful-payment state.
- Cursor retains ownership of marketing-page integration and any surrounding lead-form corrections.
- Scene 04/06 remains separately approval-gated.

## Execution outcome

The owner approved the exact prompt, two references, settings, and one-generation action. Higgsfield job `3f09077f-13e7-45fd-9d29-31b0b1dd4713` completed as a 2048×1360 PNG and is saved at `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`. The successful-payment interface is perspective-matched into the phone and the lower thumb contacts the screen. Primary confirmation hierarchy is recognizable; some tiny body copy is softened by generation. Exactly 7 credits were charged, leaving 86.72. No retry was submitted. The owner accepted attempt 1 on 2026-08-14. Cursor owns integration from that exact local path; the Codex branch does not integrate the asset.

## Integration outcome (Cursor, 2026-08-14)

Cursor integrated the accepted PNG on `feat/ops-kds-marketing-batch` (a pointer-only branch switch from `codex/journey-02-walkthrough`; both pointed at `f57ccbb` and the entire dirty batch tree was preserved). The Scene 03 poster `public/marketing/scroll/momo.webp` was rebuilt from the accepted PNG using the batch's existing poster pipeline (ffmpeg `scale=1600:-2`, libwebp quality 82 → 1600×1062, 143 KB). The source PNG is preserved untouched under `.scratch`, and Scene 03 remains deliberately clip-less (still-crossfade); the rejected `leg_momo` video stays unused. Verification: scene-3 harness 10/10 at 1440×900 and 390×844 (fresh poster served, payment-success hierarchy recognizable, crossfade seams to scenes 2 and 4 healthy, no overflow or console errors), scroll-world QA 16/19 with only the three pre-documented stale assertions, lint clean, production build green. No generation, upload, or credit spend occurred; the branch remains uncommitted and undeployed pending owner review.
