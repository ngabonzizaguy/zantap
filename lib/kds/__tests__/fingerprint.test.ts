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
  yesterdayGross: 4000,
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

  it("changes when kitchen stage changes", () => {
    const before = baseSnapshot();
    const after = {
      ...before,
      orders: [{ ...before.orders[0], kitchenStage: "PREPARING" as const }],
    };
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot(after)
    );
  });

  it("changes when today gross, yesterday gross, or kitchen flag changes", () => {
    const before = baseSnapshot();
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot({ ...before, todayGross: 6000 })
    );
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot({ ...before, yesterdayGross: 3000 })
    );
    expect(fingerprintKdsSnapshot(before)).not.toBe(
      fingerprintKdsSnapshot({ ...before, kitchenOpen: false })
    );
  });

  it("is stable regardless of order row sequence", () => {
    const snapshot = baseSnapshot();
    const reversed = {
      ...snapshot,
      orders: [
        {
          id: "o2",
          vendorId: "v1",
          customerPhone: "0780000001",
          deliverySector: "Kacyiru",
          landmark: "Gate",
          totalAmount: 3000,
          status: "PAID" as const,
          orderItems: [],
          createdAt: new Date("2026-06-22T11:00:00Z"),
        },
        snapshot.orders[0],
      ],
    };
    const reordered = {
      ...snapshot,
      orders: [reversed.orders[1], reversed.orders[0]],
    };
    expect(fingerprintKdsSnapshot(reversed)).toBe(
      fingerprintKdsSnapshot(reordered)
    );
  });
});
