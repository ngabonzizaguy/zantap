# Operator console — extraction checklist

When moving Ops to a separate repo/Vercel/Supabase:

1. Copy `app/ops/`, `components/ops/`, `lib/operator-client/`, `lib/ops-auth/` (until #12 auth).
2. Copy design assets: `DESIGN.md` token usage, `components/ui/primitives/`, `components/ui/Icon.tsx`.
3. Set on Ops Vercel: `ZANTAP_OPERATOR_API_URL`, `OPERATOR_API_KEY`, `OPERATOR_UI_SECRET`, `NEXT_PUBLIC_BASE_URL`.
4. Set on Zantap Vercel: `OPERATOR_API_KEY`, optional `OPS_APP_URL` for CORS.
5. Remove co-located `app/ops/` from Zantap (Control API stays).
6. Rotate `OPERATOR_API_KEY` after cutover.

## Env rotation

- `OPERATOR_API_KEY`: update on both deployments simultaneously.
- `OPERATOR_UI_SECRET`: Ops deployment only; invalidates existing cookies.
