import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInMemoryStore } from "@/lib/store/in-memory";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";

vi.mock("@/lib/store", () => ({
  getStore: vi.fn(),
}));

import { getStore } from "@/lib/store";
import { confirmStkPin, initiateStkPush } from "@/lib/momo/simulate";

describe("MoMo simulate (Store-backed)", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    const store = createInMemoryStore();
    await store.reset();
    vi.mocked(getStore).mockReturnValue(store);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function placeOrder() {
    const store = getStore();
    const available = await store.getAvailableMenu(DEMO_VENDOR_SLUG);
    return store.createOrder({
      vendorSlug: DEMO_VENDOR_SLUG,
      customerPhone: "0788000111",
      deliverySector: "Kicukiro",
      landmark: "Simulate test",
      items: [{ menuItemId: available[0].id, quantity: 1 }],
    });
  }

  it("initiateStkPush persists a PENDING Payment and returns its token", async () => {
    const order = await placeOrder();
    const pushPromise = initiateStkPush({
      orderId: order.id,
      phone: "0788123456",
      amount: order.totalAmount,
      vendorName: "Test Vendor",
    });
    await vi.advanceTimersByTimeAsync(2000);
    const push = await pushPromise;

    expect(push.status).toBe("PENDING");
    expect(push.token).toMatch(/^stk_/);

    const payment = await getStore().getPaymentByRef(push.token);
    expect(payment?.status).toBe("PENDING");
    expect(payment?.orderId).toBe(order.id);
  });

  it("confirmStkPin marks the Order PAID on a valid PIN", async () => {
    const order = await placeOrder();
    const pushPromise = initiateStkPush({
      orderId: order.id,
      phone: "0788123456",
      amount: order.totalAmount,
      vendorName: "Test Vendor",
    });
    await vi.advanceTimersByTimeAsync(2000);
    const push = await pushPromise;

    const confirm = await confirmStkPin({ token: push.token, pin: MOMO_SIM_VALID_PIN });
    expect(confirm.status).toBe("SUCCESS");

    const paid = await getStore().getOrder(order.id);
    expect(paid?.status).toBe("PAID");
  });

  it("returns FAILED on wrong PIN but keeps Payment PENDING", async () => {
    const order = await placeOrder();
    const pushPromise = initiateStkPush({
      orderId: order.id,
      phone: "0788123456",
      amount: order.totalAmount,
      vendorName: "Test Vendor",
    });
    await vi.advanceTimersByTimeAsync(2000);
    const push = await pushPromise;

    const confirm = await confirmStkPin({ token: push.token, pin: "00000" });
    expect(confirm.status).toBe("FAILED");
    expect(confirm.message).toBe("Invalid PIN. Please try again.");

    const payment = await getStore().getPaymentByRef(push.token);
    expect(payment?.status).toBe("PENDING");

    const unpaid = await getStore().getOrder(order.id);
    expect(unpaid?.status).toBe("PENDING");
  });

  it('returns "Payment not found" for an unknown token', async () => {
    const confirm = await confirmStkPin({
      token: "stk_unknown_token",
      pin: MOMO_SIM_VALID_PIN,
    });
    expect(confirm.status).toBe("FAILED");
    expect(confirm.message).toBe("Payment not found");
  });

  it("reuses the existing token on duplicate STK push for the same order", async () => {
    const order = await placeOrder();
    const firstPromise = initiateStkPush({
      orderId: order.id,
      phone: "0788123456",
      amount: order.totalAmount,
      vendorName: "Test Vendor",
    });
    await vi.advanceTimersByTimeAsync(2000);
    const first = await firstPromise;

    const secondPromise = initiateStkPush({
      orderId: order.id,
      phone: "0788123456",
      amount: order.totalAmount,
      vendorName: "Test Vendor",
    });
    await vi.advanceTimersByTimeAsync(2000);
    const second = await secondPromise;

    expect(second.token).toBe(first.token);
    expect(second.status).toBe("PENDING");
  });

  it("confirm replay is idempotent and does not double-count gross", async () => {
    const store = getStore();
    const baseline = await store.getTodayGross(DEMO_VENDOR_SLUG);
    const order = await placeOrder();
    const pushPromise = initiateStkPush({
      orderId: order.id,
      phone: "0788123456",
      amount: order.totalAmount,
      vendorName: "Test Vendor",
    });
    await vi.advanceTimersByTimeAsync(2000);
    const push = await pushPromise;

    const first = await confirmStkPin({ token: push.token, pin: MOMO_SIM_VALID_PIN });
    expect(first.status).toBe("SUCCESS");
    expect(await store.getTodayGross(DEMO_VENDOR_SLUG)).toBe(
      baseline + order.totalAmount
    );

    const second = await confirmStkPin({ token: push.token, pin: MOMO_SIM_VALID_PIN });
    expect(second.status).toBe("SUCCESS");
    expect(await store.getTodayGross(DEMO_VENDOR_SLUG)).toBe(
      baseline + order.totalAmount
    );
  });
});
