import type { Order } from "@/lib/types";
import { formatRwf } from "@/lib/format";

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

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
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
