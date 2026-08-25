import type { Lead } from "@/lib/leads/types";
import type { Order } from "@/lib/types";
import { formatRwf, normalizePhone } from "@/lib/format";

/** Local Rwanda or canonical international number → WhatsApp wa.me path. */
export function toWhatsAppE164(localPhone: string): string {
  const digits = normalizePhone(localPhone);
  if (digits.length === 10 && digits.startsWith("0")) {
    return `250${digits.slice(1)}`;
  }
  if (/^[1-9]\d{7,14}$/.test(digits)) {
    return digits;
  }
  return "";
}

export function buildDeliverySlip(order: Order, vendorName: string): string {
  const lines = [
    "ZANTAP  ·  DELIVERY SLIP",
    `Order ${order.id}`,
    "------------------------",
  ];

  for (const item of order.orderItems) {
    const name = item.menuItem?.name ?? "Item";
    lines.push(
      `${item.quantity}x ${name}${item.sizeLabel ? ` · ${item.sizeLabel}` : ""}`
    );
  }

  lines.push(
    "------------------------",
    `TO: ${order.deliverySector}`,
    order.landmark,
    `Customer: ${order.customerPhone}`,
    "------------------------",
    `PAID · MoMo · ${formatRwf(order.totalAmount)}`,
    `Vendor: ${vendorName}`
  );

  return lines.join("\n");
}

export function buildWhatsAppUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone !== undefined) {
    const e164 = toWhatsAppE164(phone);
    if (e164) {
      return `https://wa.me/${e164}?text=${encoded}`;
    }
  }
  return `https://wa.me/?text=${encoded}`;
}

export function buildLeadWhatsAppUrl(
  recipientPhone: string,
  lead: Pick<
    Lead,
    | "businessName"
    | "businessType"
    | "contactName"
    | "phone"
    | "area"
  >
): string {
  const text = [
    "New ZanTap partner request",
    `Business: ${lead.businessName}`,
    `Type: ${lead.businessType}`,
    `Contact: ${lead.contactName}`,
    `Phone: +${lead.phone}`,
    `Area: ${lead.area}`,
  ].join("\n");
  return buildWhatsAppUrl(text, recipientPhone);
}

export function buildVendorWhatsAppUrl(
  vendorPhone: string,
  order: Order,
  vendorName: string,
  origin: string
): string {
  const slipUrl = `${origin.replace(/\/$/, "")}/slip/${order.id}`;
  const text = buildVendorOrderNotification(order, vendorName, slipUrl);
  return buildWhatsAppUrl(text, vendorPhone);
}

export function buildVendorOrderNotification(
  order: Order,
  vendorName: string,
  slipUrl: string
): string {
  const itemLines = order.orderItems
    .map(
      (i) =>
        `• ${i.quantity}x ${i.menuItem?.name ?? "Item"}${i.sizeLabel ? ` · ${i.sizeLabel}` : ""}`
    )
    .join("\n");

  return [
    `🍔 NEW PAID ORDER (${order.id})`,
    itemLines,
    `• Total: ${formatRwf(order.totalAmount)} (Verified via MoMo)`,
    `• Deliver to: ${order.deliverySector} (${order.landmark})`,
    `• Driver Slip: ${slipUrl}`,
    `— ${vendorName}`,
  ].join("\n");
}
