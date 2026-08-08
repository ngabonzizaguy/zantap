# Paypack API integration reference

Status: research complete on 2026-08-08; implementation deliberately deferred.

This note translates Paypack's current public documentation into a safe ZanTap
integration outline. It does **not** change the live manual-MoMo checkout. A
production integration needs merchant credentials, sandbox testing, and a
separate payment-state design review before code is enabled.

## Official references

- [Getting started](https://docs.paypack.rw/overview/getting-started)
- [Authentication](https://docs.paypack.rw/quickstart/authentication)
- [Payment flow](https://docs.paypack.rw/overview/payment-flow)
- [API reference](https://docs.paypack.rw/quickstart/api-reference)
- [Webhooks](https://docs.paypack.rw/quickstart/webhooks)
- [Rate limiting](https://docs.paypack.rw/overview/rate-limiting)
- [JavaScript SDK](https://docs.paypack.rw/sdk/javascript)

## Account and credentials

1. Register a Paypack dashboard account, verify it, and create an application
   with only the privileges ZanTap needs (initially cash-in plus transaction
   read access).
2. Copy the generated `client_id` and one-time-visible `client_secret` into
   server-only environment variables. They must never use a `NEXT_PUBLIC_`
   prefix or enter client bundles/logs.
3. Register separate Development and Production HTTPS webhook URLs in the
   Paypack dashboard. Store each webhook signing secret server-side.

Suggested variable names:

```text
PAYPACK_CLIENT_ID=
PAYPACK_CLIENT_SECRET=
PAYPACK_WEBHOOK_SIGNING_SECRET=
PAYPACK_MODE=development
```

## Server-side payment flow

1. Authorize the application with `POST
   https://payments.paypack.rw/api/auth/agents/authorize`, sending
   `client_id` and `client_secret`. Cache the returned access/refresh tokens
   only on the server. The documented access-token lifetime is 15 minutes.
2. Start collection with `POST
   https://payments.paypack.rw/api/transactions/cashin`, a bearer token, JSON
   `{ amount, number }`, `X-Webhook-Mode`, and a unique `Idempotency-Key` of at
   most 32 characters. ZanTap should derive and persist that key per payment
   attempt before the request is sent.
3. Persist the returned Paypack `ref` while the payment remains pending. Do not
   mark an order paid from the initial cash-in response.
4. Treat the signed `transaction:processed` webhook as the primary completion
   signal. Reconcile unknown or delayed outcomes with `GET
   /api/transactions/find/{ref}`.
5. Advance the order to `PAID` only after a matching successful cash-in has the
   expected reference, vendor/payment attempt, phone, and amount. Failed events
   must never expose the order to KDS. Pending outcomes remain retryable under
   the existing payment window policy.

## Webhook safety requirements

- Accept public `HEAD` probes separately and return a quick success response.
- For `POST`, capture the exact raw request bytes before JSON parsing.
- Compute HMAC-SHA256 with the webhook signing secret, encode it as Base64, and
  compare it with `X-Paypack-Signature` using a constant-time comparison.
- Reject missing/invalid signatures before any Store mutation.
- Deduplicate by `event_id` and make processing idempotent by transaction `ref`.
- Acknowledge valid duplicate events without repeating the state transition.
- Log references and statuses, never tokens, secrets, complete webhook bodies,
  or full customer phone numbers.

The conditional shown in Paypack's current JavaScript webhook example combines
signature and HTTP-method checks in a way ZanTap should **not** copy. Signature
verification must be mandatory for every webhook `POST`.

## Operational constraints and open verification

- Paypack documents a static limit of 300 requests per minute per application.
  Use webhook delivery instead of transaction polling loops and back off on
  throttling or transient failures.
- Cash-in/cash-out support an optional idempotency header; ZanTap must make it
  mandatory at its adapter boundary.
- The authentication page labels the refresh path with an `/agents/` segment,
  while its examples show `/api/auth/refresh/{refresh_token}`. Confirm the live
  sandbox route before implementing refresh logic.
- Confirm accepted Rwanda phone formats, currency/amount constraints, webhook
  retry timing, signature behavior, production onboarding/KYC, settlement,
  fees, refunds, and sandbox test numbers directly with Paypack.
- Prefer a small server-only HTTP adapter over coupling payment state to the
  third-party SDK. This keeps credentials, timeouts, idempotency, and webhook
  verification explicit behind ZanTap's existing payment seam.

## Deliberate non-change

`MOMO_MODE=manual` remains the production-safe default. No Paypack package,
credential, database field, callback route, or order-state transition is added
by this research task. Implementing those is a payment-network state change and
must start with the project's payment grilling/PRD process.
