import { describe, expect, it } from "vitest";
import { fingerprintKdsSnapshot } from "@/lib/kds/fingerprint";
import type { KdsSnapshot } from "@/lib/kds/types";

const baseSnapshot = (): KdsSnapshot => ({
  orders: [
    {
      id: "o1",
      vendorId: "v1",
      customerPhone: "0780000000",
      deliverySector: "Kacyiru",
      landmark: "Near shop",
      totalAmount: 5000,
      status: "PAID",
      orderItems: [],
      createdAt: new Date("2026-06-22T10:00:00Z"),
    },
  ],
  menu: [
    {
      id: "m1",
      vendorId: "v1",
      name: "Brochette",
      priceRwf: 2500,
      category: "Grill",
      isAvailable: true,
    },
  ],
  todayGross: 5000,
  kitchenOpen: true,
});

describe("fingerprintKdsSnapshot", () => {
  it("is stable for the same snapshot", () => {
    const snapshot = baseSnapshot();
    expect(fingerprintKdsSnapshot(snapshot)).toBe(
      fingerprintKdsSnapshot(snapshot)
    );
  });

  it("changes when an order status changes", () => {
    const before = baseSnapshot();
    const after = {
      ...before,
      orders: [{ ...before.orders[0], status: "DISPATCHED" as const }],
    };
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot(after)
    );
  });

  it("changes when menu availability changes", () => {
    const before = baseSnapshot();
    const after = {
      ...before,
      menu: [{ ...before.menu[0], isAvailable: false }],
    };
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot(after)
    );
  });

  it("changes when today gross or kitchen flag changes", () => {
    const before = baseSnapshot();
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot({ ...before, todayGross: 6000 })
    );
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot({ ...before, kitchenOpen: false })
    );
  });
});
