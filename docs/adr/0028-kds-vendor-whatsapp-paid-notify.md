# ADR-0028: KDS vendor WhatsApp PAID notify (wa.me deep-link)

Date: 2026-07-02
Status: Accepted (candidate #9, Issue 01)

## Context

When a customer completes MoMo payment, the order appears on the KDS via SSE within
~1s — but the vendor owner/manager is not proactively alerted on WhatsApp. Kitchen
staff must keep the KDS tab open and watch for new tickets.

`buildVendorOrderNotification` existed in `lib/whatsapp.ts` but was unused. The
dispatch modal already shares a **driver delivery slip** via phoneless
`wa.me/?text=…` at dispatch time — a different moment and audience.

Owner locked **Option A** (2026-06-29): KDS staff tap a one-shot action on an
expanded PAID ticket; no server send, no schema changes.

## Decision

1. **Extend `lib/whatsapp.ts`** with Rwanda E.164 normalization (`toWhatsAppE164`),
   optional phone on `buildWhatsAppUrl(text, phone?)`, and
   `buildVendorWhatsAppUrl(vendorPhone, order, vendorName, origin)` composing the
   PAID notification + absolute `/slip/{orderId}` URL.

2. **KDS ticket CTA** — "Notify vendor on WhatsApp" on expanded tickets when
   `order.status === "PAID"` and `kitchenStage` is before `OUT_FOR_DELIVERY` /
   `COMPLETED`. Opens `window.open(url, "_blank", "noopener")`; does **not** advance
   kitchen stage. Hidden after dispatch. Disabled + tooltip when
   `Vendor.phoneNumber` normalizes to empty E.164.

3. **Dispatch modal unchanged** — driver slip share remains phoneless
   `buildWhatsAppUrl(slipText)` and still advances to `OUT_FOR_DELIVERY` on share.

4. **Deferred:** Option B (WhatsApp Business API auto-send), Option C (customer
   success receipt copy), Setup drawer phone CRUD.

## Consequences

- Vendors with seeded `phoneNumber` (`0788123456` → `250788123456`) get a
  prefilled vendor notify deep link from the KDS.
- No new env vars required for dev/prod smoke (`window.location.origin` at click).
- Unit tests in `lib/__tests__/whatsapp.test.ts` cover E.164, URL builders, and
  notification body.
