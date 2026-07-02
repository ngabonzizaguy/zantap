import type { Order } from "@/lib/types";
import { formatRwf, normalizePhone } from "@/lib/format";

/** Rwanda local → WhatsApp wa.me path segment (e.g. 0788123456 → 250788123456). */
export function toWhatsAppE164(localPhone: string): string {
  const digits = normalizePhone(localPhone);
  if (digits.length === 12 && digits.startsWith("250")) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `250${digits.slice(1)}`;
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
    lines.push(`${item.quantity}x ${name}`);
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
    .map((i) => `• ${i.quantity}x ${i.menuItem?.name ?? "Item"}`)
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
