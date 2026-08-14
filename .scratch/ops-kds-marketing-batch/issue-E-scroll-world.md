# Issue E — Scroll-world code + shot list

**Status:** DONE · SHIPPED 2026-08-14 (`7d87984` → `zantap.app`; journey 02 clip + journey 03 still live in prod); journey 02/06 accepted and baked on `codex/journey-02-walkthrough`; journey 03/06 attempt 1 owner-accepted, handed to Cursor, and **integrated on `feat/ops-kds-marketing-batch` 2026-08-14** (no retry; not integrated on the Codex branch)  
**Branches:** `feat/ops-kds-marketing-batch` (Cursor batch) and `codex/journey-02-walkthrough` (accepted Journey 02 integration)

## Checklist

- [x] Eased / bouncy scrub stops + smoother clip↔still transitions
- [x] Blurred/faded screenshot framing (new UI-screens folder)
- [x] Soft edges at section opening
- [x] Shot list + prompts doc for scenes 2–4 continuous "one order, two screens" + 3D character sheet
- [x] No AI generation without per-asset owner approval
- [x] Journey 02/06 direction changed to approved photoreal Repub Lounge + real `storefront.png` references; exact attempt-1 prompt/action prepared for owner approval (2026-08-14)
- [x] Owner explicitly approved the final journey 02/06 attempt-1 prompt and upload/generate action (2026-08-14)
- [x] Run exactly one attempt (32.5 credits via the Higgsfield connector), review it with the owner, and skip attempt 2 after owner acceptance
- [x] Enable "Allow access to file URLs" for the ChatGPT browser extension (owner confirmed 2026-08-14)
- [x] Bypass the blocked Chrome surface with the Higgsfield connector while preserving the exact approved model, references, prompt, and settings
- [x] Encode the accepted output for dense-keyframe, audio-free web scrubbing and replace Scene 02 plus its first-frame poster on `codex/journey-02-walkthrough`
- [x] Owner approves the exact Journey 03/06 two-reference image-edit prompt/settings and one 7-credit generation
- [x] Generate Journey 03/06 exactly once and return the image for review; Cursor owns integration
- [x] Owner accepts Journey 03/06 attempt 1; hand the exact PNG path to Cursor without integrating it on the Codex branch
- [x] Cursor integrates the accepted Journey 03 PNG on `feat/ops-kds-marketing-batch` (2026-08-14): Scene 03 poster `public/marketing/scroll/momo.webp` rebuilt from the accepted PNG (ffmpeg scale=1600:-2, libwebp q82 → 1600×1062, 143 KB); source PNG preserved under `.scratch`; scene stays deliberately clip-less (still-crossfade); scene-3 checks 10/10 (desktop + 390×844 mobile), scroll-world QA 16/19 (3 known-stale assertions only), lint + build green; zero generations/credits

## Locked decisions

- Scenes 2–4 remain a continuous "one order, two screens" story; scenes 1/5/6 are unchanged this batch.
- The earlier stylized 3D/Pixar-like proposal is superseded for journey 02/06 only by the owner-approved grounded, photoreal Repub Lounge + real ZanTap storefront direction. Scenes 03/06 and 04/06 remain separately gated.
- Higgsfield UI state verified 2026-08-14: Seedance 2.5, References mode, 5s, 16:9, 720p, high bitrate, 38.33 credits per Generate. No references are attached and the older generic prompt remains in the textbox.
- Credit policy: owner-reported balance 126. Two-attempt working budget = 76.66 credits; review attempt 1 before any second spend. Attempt 3 is a hard reserve and requires a new explicit owner approval. Projected balances: 87.67 after attempt 1, 49.34 after attempt 2, 11.01 after the reserved third.
- Attempt-1 execution note (2026-08-14): the owner approved one attempt. The two-file chooser opened, but Chrome rejected `setFiles` because the ChatGPT browser extension does not currently have file-URL access. Neither reference attached, Generate was not clicked, and zero credits were spent. Resume only after the owner enables that extension permission.
- Recovery note (2026-08-14): the owner enabled file-URL access and refreshed the draft. Extension/native-host diagnostics passed, but Chrome then timed out on both claiming the refreshed tab and controlling a fresh same-profile window. No reference attached, the prompt was not transmitted, Generate was not clicked, and the balance remains 126. Per the Chrome troubleshooting flow, reinstall the Browser plugin from the ChatGPT plugin UI before resuming the still-valid approval.
- Connector completion (2026-08-14): the owner exposed the Higgsfield connector. Read-only model inspection confirmed Seedance 2.5 `omni_reference`, two image references, 5s, 16:9, 720p, and High bitrate. Both approved references were uploaded and one generation was submitted (job `0a409cd1-425b-4ffd-a5c1-22bb104601a4`) at the connector's 32.5-credit price. Output is saved at `.scratch/ops-kds-marketing-batch/journey-02-attempt-1.mp4`; review frames/contact sheet sit beside it. Owner verdict: “This shot is fine. Truly!” Attempt 1 is accepted, attempt 2 is skipped, attempt 3 remains untouched, and the confirmed balance is 93.72 credits.
- Walkthrough integration (2026-08-14): on `codex/journey-02-walkthrough`, the accepted master was encoded at native 1280×720/24fps as audio-free H.264 with an 8-frame maximum GOP, CRF 20, `faststart`, and light unsharp. It now backs `public/marketing/vid/order.mp4`; `public/marketing/scroll/order.webp` is the encoded clip's actual first frame. Desktop seam review, reduced-motion behavior, touch scrubbing, and mobile overflow were checked. The shared preview harness passed 16/19; its three failures are stale assertions for Cursor's accepted footer logo, removed MoMo-logo overlay, and updated sticky-CTA wording, not Journey 02 regressions. ESLint is clean.
- Journey 03/06 correction result (2026-08-14): after exact owner approval, the two references were uploaded in the recorded order and one GPT Image 2, 3:2, 2K, High job was submitted: `3f09077f-13e7-45fd-9d29-31b0b1dd4713`. The 2048×1360 PNG is saved at `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`. It integrates the successful-payment UI into the tilted phone with the lower thumb contacting the screen; core confirmation hierarchy is recognizable, while some tiny body copy is generatively softened. Exactly 7 credits were charged; confirmed balance 86.72. No retry was submitted. The owner accepted attempt 1 on 2026-08-14. Cursor handoff path: `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`; Cursor owns integration, and the Codex branch must not integrate it.

## Shot list

`.scratch/ops-kds-marketing-batch/shot-list-scenes-2-4.md`
