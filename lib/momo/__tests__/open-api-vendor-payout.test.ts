import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInMemoryStore } from "@/lib/store/in-memory";
import type { MomoOpenApiClient } from "@/lib/momo/open-api-client";

const store = createInMemoryStore();

vi.mock("@/lib/store", () => ({
  getStore: () => store,
}));

import { initiateVendorPayoutForOrder } from "@/lib/momo/open-api-collection";

function mockClient(
  transferImpl: MomoOpenApiClient["transfer"],
): MomoOpenApiClient {
  return {
    requestToPay: vi.fn(),
    getRequestToPayStatus: vi.fn(),
    transfer: transferImpl,
    getTransferStatus: vi.fn(),
    createPreapproval: vi.fn(),
    getPreapprovalStatus: vi.fn(),
  } as unknown as MomoOpenApiClient;
}

describe("initiateVendorPayoutForOrder", () => {
  beforeEach(() => {
    store.reset();
  });

  async function paidOrderId(): Promise<string> {
    const vendors = await store.listVendors();
    const vendor = vendors[0];
    const menu = await store.getAvailableMenu(vendor.slug);
    const item = menu[0];
    const order = await store.createOrder({
      vendorSlug: vendor.slug,
      customerPhone: "0788123456",
      deliverySector: "Kimironko",
      landmark: "gate",
      items: [{ menuItemId: item.id, quantity: 2 }],
    });
    const ref = `col-${order.id}`;
    await store.createPayment({
      orderId: order.id,
      amount: order.totalAmount,
      transactionRef: ref,
    });
    await store.applyProviderPaymentResult(ref, "SUCCESS");
    return order.id;
  }

  it("persists PENDING VendorPayout when MoMo accepts Transfer", async () => {
    const orderId = await paidOrderId();
    const client = mockClient(
      vi.fn().mockResolvedValue({ referenceId: "ignored" }),
    );

    const result = await initiateVendorPayoutForOrder(orderId, client);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.started).toBe(true);
    expect(result.payout.status).toBe("PENDING");
    expect(client.transfer).toHaveBeenCalled();

    const latest = await store.getLatestVendorPayoutForOrder(orderId);
    expect(latest?.referenceId).toBe(result.payout.referenceId);
    expect(latest?.status).toBe("PENDING");

    const order = await store.getOrder(orderId);
    expect(order?.status).toBe("PAID");
  });

  it("marks FAILED and keeps Order PAID when MoMo rejects Transfer", async () => {
    const orderId = await paidOrderId();
    const client = mockClient(
      vi.fn().mockRejectedValue(new Error("MoMo 400 bad payee")),
    );

    const result = await initiateVendorPayoutForOrder(orderId, client);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.payout?.status).toBe("FAILED");
    expect(result.message).toContain("bad payee");

    const order = await store.getOrder(orderId);
    expect(order?.status).toBe("PAID");
  });

  it("does not start a second Transfer while PENDING", async () => {
    const orderId = await paidOrderId();
    const transfer = vi.fn().mockResolvedValue({ referenceId: "x" });
    const client = mockClient(transfer);

    await initiateVendorPayoutForOrder(orderId, client);
    const second = await initiateVendorPayoutForOrder(orderId, client);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.started).toBe(false);
    expect(transfer).toHaveBeenCalledTimes(1);
  });
});
