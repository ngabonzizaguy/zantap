import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/types";
import {
  buildVendorOrderNotification,
  buildVendorWhatsAppUrl,
  buildWhatsAppUrl,
  toWhatsAppE164,
} from "@/lib/whatsapp";

const sampleOrder: Order = {
  id: "cmqtest0001",
  vendorId: "v1",
  customerPhone: "0788111222",
  deliverySector: "Kimironko",
  landmark: "Near mosque",
  totalAmount: 8500,
  status: "PAID",
  kitchenStage: "NEW",
  orderItems: [
    {
      id: "oi-1",
      orderId: "cmqtest0001",
      menuItemId: "m1",
      quantity: 2,
      unitPriceRwf: 3500,
      sizeOptionId: "large",
      sizeLabel: "Large",
      addOnSelections: [{
        groupId: "extras",
        groupName: "Choose extras",
        choices: [{ choiceId: "avocado", label: "Avocado", priceRwf: 1000 }],
      }],
      menuItem: {
        id: "m1",
        vendorId: "v1",
        name: "Brochettes",
        priceRwf: 3500,
        category: "Grill",
        isAvailable: true,
      },
    },
  ],
  createdAt: new Date("2026-07-01T10:00:00Z"),
  paidAt: new Date("2026-07-01T10:01:00Z"),
};

describe("toWhatsAppE164", () => {
  it("converts 10-digit Rwanda local numbers", () => {
    expect(toWhatsAppE164("0788123456")).toBe("250788123456");
  });

  it("strips formatting and passes through +250 prefix", () => {
    expect(toWhatsAppE164("+250 788 123 456")).toBe("250788123456");
  });

  it("preserves another canonical international number", () => {
    expect(toWhatsAppE164("+254 712 345 678")).toBe("254712345678");
  });

  it("returns empty for invalid or short numbers", () => {
    expect(toWhatsAppE164("12345")).toBe("");
    expect(toWhatsAppE164("")).toBe("");
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds phoneless URL for dispatch slip share", () => {
    const url = buildWhatsAppUrl("Hello driver");
    expect(url).toBe("https://wa.me/?text=Hello%20driver");
  });

  it("embeds E.164 phone in path when provided", () => {
    const url = buildWhatsAppUrl("New order", "0788123456");
    expect(url).toMatch(/^https:\/\/wa\.me\/250788123456\?text=/);
    expect(decodeURIComponent(url.split("?text=")[1]!)).toBe("New order");
  });
});

describe("buildVendorOrderNotification", () => {
  it("includes order id, items, total, delivery, and slip URL", () => {
    const slipUrl = "https://zantap.example/slip/cmqtest0001";
    const body = buildVendorOrderNotification(sampleOrder, "Inka Steakhouse", slipUrl);

    expect(body).toContain("cmqtest0001");
    expect(body).toContain("2x Brochettes");
    expect(body).toContain("2x Brochettes · Large");
    expect(body).toContain("+ Avocado");
    expect(body).toContain("8,500 RWF");
    expect(body).toContain("Kimironko");
    expect(body).toContain("Near mosque");
    expect(body).toContain(slipUrl);
    expect(body).toContain("Inka Steakhouse");
  });
});

describe("buildVendorWhatsAppUrl", () => {
  it("composes vendor notify deep link with phone and encoded body", () => {
    const url = buildVendorWhatsAppUrl(
      "0788123456",
      sampleOrder,
      "Inka Steakhouse",
      "https://zantap.example/"
    );

    expect(url).toMatch(/^https:\/\/wa\.me\/250788123456\?text=/);
    const text = decodeURIComponent(url.split("?text=")[1]!);
    expect(text).toContain("NEW PAID ORDER");
    expect(text).toContain("https://zantap.example/slip/cmqtest0001");
  });

  it("strips trailing slash from origin", () => {
    const url = buildVendorWhatsAppUrl(
      "0788123456",
      sampleOrder,
      "Inka",
      "https://zantap.example"
    );
    const text = decodeURIComponent(url.split("?text=")[1]!);
    expect(text).toContain("https://zantap.example/slip/cmqtest0001");
  });
});
