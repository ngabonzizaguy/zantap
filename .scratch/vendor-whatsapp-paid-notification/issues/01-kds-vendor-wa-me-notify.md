# Issue 01 — KDS vendor WhatsApp PAID notify (wa.me deep-link)

Status: **done · deployed · prod-smoked** (2026-07-02)
Feature: vendor-whatsapp-paid-notification · candidate #9
Refs: PRD `.scratch/vendor-whatsapp-paid-notification/PRD.md`
Labels: ready-for-agent

## Goal

When kitchen staff expand a PAID ticket (kitchen stage before `OUT_FOR_DELIVERY`),
a **"Notify vendor on WhatsApp"** button opens `wa.me/{vendorE164}?text=` prefilled
with `buildVendorOrderNotification` + absolute `/slip/{orderId}` URL. Reuses the
existing unused stub in `lib/whatsapp.ts`. **No Store/schema/server-action changes.**

Owner locked **Option A — KDS ticket button** (2026-06-29).

## Files

| Piece | Path | Action |
|-------|------|--------|
| E.164 + URL composers | `lib/whatsapp.ts` | extend |
| Unit tests | `lib/__tests__/whatsapp.test.ts` (new) | create |
| Ticket button | `components/vendor/OrderTicket.tsx` | add CTA + visibility rules |
| Pass vendor phone | `components/vendor/KdsDashboard.tsx` → `OrdersList` → `OrderTicket` | wire prop if needed |

## Steps

1. **`toWhatsAppE164(phone: string): string`** in `lib/whatsapp.ts`:
   - Strip non-digits (`normalizePhone` from `@/lib/format`).
   - 10-digit local (`0788123456`) → prefix `250` + drop leading `0` → `250788123456`.
   - Already `250…` (12 digits) → pass through.
   - Invalid/short → return `""` (caller disables button).
2. **Extend `buildWhatsAppUrl(text, phone?: string)`**:
   - With phone → `https://wa.me/${e164}?text=${encodeURIComponent(text)}`.
   - Without phone → keep today's `https://wa.me/?text=…` (dispatch modal unchanged).
3. **`buildVendorWhatsAppUrl(vendorPhone, order, vendorName, origin: string)`**:
   - `slipUrl = `${origin.replace(/\/$/, "")}/slip/${order.id}``.
   - `text = buildVendorOrderNotification(order, vendorName, slipUrl)`.
   - Return `buildWhatsAppUrl(text, vendorPhone)`.
4. **Unit tests** (`lib/__tests__/whatsapp.test.ts`):
   - E.164 for seed-style `0788123456` and `+250 788 123 456`.
   - URL includes encoded phone path when provided.
   - Notification body contains order id, total, sector, slip URL.
   - `buildWhatsAppUrl(text)` without phone unchanged (dispatch compat).
5. **`OrderTicket.tsx`**:
   - New optional prop `vendorPhone: string`.
   - Show button when `order.status === "PAID"` and stage ∉
     `{OUT_FOR_DELIVERY, COMPLETED}` and `toWhatsAppE164(vendorPhone)` non-empty.
   - Label: **"Notify vendor on WhatsApp"** — outline/secondary, WhatsApp green accent
     (match `DispatchModal` CTA styling family).
   - `onClick`: `window.open(buildVendorWhatsAppUrl(..., window.location.origin), "_blank", "noopener")`.
   - Does **not** call stage advance or dispatch handlers.
6. **Wire `vendor.phoneNumber`** from `KdsDashboard` through `OrdersList` to each
   `OrderTicket` (or pass whole `vendor` if cleaner — minimal diff).
7. `npm test` + `npm run build` green.

## Do NOT

- Change dispatch modal slip share (`buildDeliverySlip` + phoneless `wa.me`).
- Add WhatsApp Business API, webhooks, or server-side send.
- Touch customer `SuccessReceipt`, Store, Prisma, or payment flow.
- Start live MoMo (#11), auth (#12), or real modifiers (need `/grill-with-docs`).

## Acceptance

- [x] Expanded active PAID ticket shows WhatsApp vendor button (not after dispatch).
- [x] Click opens prefilled `wa.me/250…` with PAID notification + slip URL.
- [x] Dispatch modal "Copy & Share to WhatsApp" behavior unchanged.
- [x] Unit tests for E.164 + URL builders pass; build green.

## Manual smoke

- [x] Prod 2026-07-02: MoMo PIN `12345` → PAID on `/vendor/inka-steakhouse` (Playwright).
- [x] Expand ticket → "Notify vendor on WhatsApp" → `wa.me/250788123456` + `/slip/{id}`.
- [x] Dispatch modal "Copy & Share to WhatsApp" still phoneless `wa.me/?text=` + delivery slip.

## Comments

Single-issue MVP for candidate #9. ADR at ship time if needed (lightweight — no
schema). Future: Option B auto-send, Option C customer copy, Setup phone edit.
