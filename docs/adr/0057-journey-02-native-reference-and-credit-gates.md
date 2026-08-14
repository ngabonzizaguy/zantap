# ADR-0057: Journey 02 native-reference strategy and credit gates

Date: 2026-08-14

Status: Accepted and implemented on `codex/journey-02-walkthrough`; attempt 1 completed and owner-accepted, attempt 2 skipped, attempt 3 reserved

## Context

The Ops/KDS marketing batch originally proposed a stylized 3D recurring cast for scroll-world scenes 2–4. For journey 02/06 (the customer ordering on a phone), the owner instead approved a grounded direction using Repub Lounge as the Kigali hospitality reference and the real ZanTap `storefront.png` as the phone-screen reference.

The open Higgsfield draft is Seedance 2.5 in References mode at 5 seconds, 16:9, 720p, high bitrate. The Generate button shows 38.33 credits. No references are attached and the textbox still contains the older generic eatery prompt. The owner reports a balance of 126 credits.

## Decision

1. Journey 02/06 uses a photoreal Kigali restaurant setting informed by Repub Lounge's warm timber, thatched/woven texture, terracotta, patterned textiles, amber practical light, and greenery. The generated shot must not reproduce Repub Lounge branding or signage.
2. Attempt 1 uses the real ZanTap `storefront.png` as the second reference and explicitly asks Seedance to preserve the upright phone-screen composition. This is a deliberate fidelity test; exact generative reproduction is not assumed.
3. If attempt 1 preserves the venue and camera move but morphs the UI, attempt 2 will use a clean, stable tracked phone screen for exact post-production compositing. Its prompt is selected only after attempt-1 review.
4. No image is uploaded, no prompt is transmitted to Higgsfield, and no generation is started until the owner explicitly approves both the final attempt-1 prompt and the exact two-file upload/one-generate action.
5. Spend is sequential: one 38.33-credit attempt, owner review, then an explicit decision on attempt 2. Attempt 3 is a hard reserve and needs a new explicit owner approval.

## Budget

- Starting balance (owner-reported): 126 credits.
- Attempt 1: 38.33 credits; projected balance 87.67.
- Attempt 2, only after review: cumulative 76.66 credits; projected balance 49.34.
- Attempt 3 hard reserve: cumulative 114.99 credits; projected balance 11.01.

## Consequences

- The earlier stylized/Pixar-like direction remains historical planning and is superseded only for journey 02/06.
- Direct UI preservation is evaluated once before spending on a fallback strategy.
- The owner retains a full third attempt as an emergency reserve.
- Scenes 03/06 and 04/06 remain separately approval-gated.
- On 2026-08-14 the owner approved attempt 1, but Chrome denied the two-file upload because the ChatGPT browser extension lacks file-URL access. No reference was attached, Generate was not clicked, and zero credits were spent. The approval remains valid; resume after the owner enables the extension permission.
- Later on 2026-08-14 the owner enabled file-URL access and refreshed the draft. Extension/native-host diagnostics passed, but browser control timed out when claiming both the refreshed tab and a fresh same-profile Higgsfield tab. No reference was attached, the prompt was not transmitted, Generate was not clicked, and the balance remains 126. Reinstall the Browser plugin from the ChatGPT plugin UI before resuming the still-valid approval.
- The owner then exposed the Higgsfield connector. It supported every approved generation control and both local references, so the same approval was executed through that surface. The connector estimated and charged 32.5 credits (below the browser UI's 38.33), producing job `0a409cd1-425b-4ffd-a5c1-22bb104601a4`. The owner accepted the result without a retry. Actual remaining balance: 93.72 credits. Attempt 2 is skipped and attempt 3 remains untouched.
- The accepted result is integrated only on `codex/journey-02-walkthrough`: a native-resolution, audio-free, dense-keyframe H.264 web encode replaces the Scene 02 `order.mp4`, and its actual first frame replaces `order.webp`. Cursor's `feat/ops-kds-marketing-batch` branch is not modified by this integration decision.
