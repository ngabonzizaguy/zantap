# ADR-0032: Configurable public base URL (G1)

Date: 2026-07-02
Status: Accepted (candidate #19, Issue 11)

## Context

Storefront/QR/share/WhatsApp links were built from `window.location.origin`, and
onboarding display copy hardcoded `zantap.ai/`. A future domain change should update
in one place. ADR-0031 introduced a partial seam in `lib/vendor/storefront-url.ts`;
Issue 11 consolidates it.

## Decision

1. **`lib/base-url.ts` is the single origin seam:**
   - `getBaseUrl()` — `NEXT_PUBLIC_BASE_URL` when set (no trailing slash), else
     `window.location.origin` on the client, else `""` on the server when unset.
   - `getDisplayHostPrefix()` — protocol-stripped host for slug input prefixes
     (e.g. `zantap.ai/`).
   - `getStorefrontUrl(slug)` / `formatStorefrontDisplayPath(slug)` — full URL and
     compact display path for QR, share, copy, and review cards.
2. **`lib/vendor/storefront-url.ts` re-exports** from `lib/base-url.ts` so existing
   imports stay stable.
3. **All link builders and display copy** route through the seam: onboarding steps,
   KDS Setup QR, Help modal WhatsApp prefill, and KDS vendor WhatsApp notify
   (`OrderTicket`).
4. **Env is optional** — unset keeps origin-based behavior on the client so local dev
   and Vercel previews work without configuration. Document in `.env.example`.

## Consequences

- Production can set `NEXT_PUBLIC_BASE_URL` once for consistent links/copy even if
  the deployment hostname differs (since 2026-08-06: `https://zantap.app`).
- No admin UI for domain management in this pass (later candidate).
