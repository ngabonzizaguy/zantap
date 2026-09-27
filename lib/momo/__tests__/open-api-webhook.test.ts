import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplyProviderPaymentResult, Order, Payment } from "@/lib/types";

const applyProviderPaymentResult = vi.fn();
const applyVendorPayoutResult = vi.fn();
const getPaymentByRef = vi.fn();
const getPaymentForOrder = vi.fn();
const getVendorPayoutByRef = vi.fn();
const getLatestVendorPayoutForOrder = vi.fn();
const initiateVendorPayoutForOrder = vi.fn();

vi.mock("@/lib/store", () => ({
  getStore: () => ({
    applyProviderPaymentResult,
    applyVendorPayoutResult,
    getPaymentByRef,
    getPaymentForOrder,
    getVendorPayoutByRef,
    getLatestVendorPayoutForOrder,
  }),
}));

vi.mock("@/lib/momo/open-api-collection", () => ({
  initiateVendorPayoutForOrder: (...args: unknown[]) =>
    initiateVendorPayoutForOrder(...args),
}));

import { handleMomoWebhook } from "@/lib/momo/open-api-webhook";

const payment: Payment = {
  id: "pay_1",
  orderId: "ord_1",
  amount: 1000,
  provider: "MTN_MOMO",
  transactionRef: "33333333-3333-4333-8333-333333333333",
  status: "PENDING",
  createdAt: new Date(),
};

const order: Order = {
  id: "ord_1",
  vendorId: "ven_1",
  customerPhone: "0788123456",
  deliverySector: "Kimironko",
  landmark: "test",
  totalAmount: 1000,
  status: "PENDING",
  orderItems: [],
  createdAt: new Date(),
};

describe("handleMomoWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPaymentByRef.mockResolvedValue(payment);
    getPaymentForOrder.mockResolvedValue(payment);
    getVendorPayoutByRef.mockResolvedValue(null);
    getLatestVendorPayoutForOrder.mockResolvedValue(null);
    applyProviderPaymentResult.mockResolvedValue({
      ok: true,
      payment: { ...payment, status: "SUCCESS" },
      order: { ...order, status: "PAID" },
    } satisfies ApplyProviderPaymentResult);
    initiateVendorPayoutForOrder.mockResolvedValue({
      ok: true,
      payout: {
        id: "vp_1",
        orderId: "ord_1",
        vendorId: "ven_1",
        amount: 1000,
        referenceId: "transfer-ref",
        status: "PENDING",
        payeeType: "MSISDN",
        payeeId: "56733123453",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      started: true,
    });
  });

  it("applies SUCCESSFUL collection and starts vendor payout", async () => {
    const result = await handleMomoWebhook({
      status: "SUCCESSFUL",
      externalId: "ord_1",
      amount: "1000",
      currency: "EUR",
    });

    expect(result.outcome).toBe("collection_success");
    expect(applyProviderPaymentResult).toHaveBeenCalledWith(
      payment.transactionRef,
      "SUCCESS",
    );
    expect(initiateVendorPayoutForOrder).toHaveBeenCalledWith("ord_1");
    expect(result.payout?.ok).toBe(true);
  });

  it("applies FAILED and does not payout", async () => {
    applyProviderPaymentResult.mockResolvedValue({
      ok: true,
      payment: { ...payment, status: "FAILED" },
      order: { ...order, status: "CANCELLED" },
    });

    const result = await handleMomoWebhook({
      status: "FAILED",
      referenceId: payment.transactionRef,
    });

    expect(result.outcome).toBe("collection_failed");
    expect(initiateVendorPayoutForOrder).not.toHaveBeenCalled();
  });

  it("applies Transfer SUCCESS to VendorPayout", async () => {
    getPaymentByRef.mockResolvedValue(null);
    getVendorPayoutByRef.mockResolvedValue({
      id: "vp_1",
      orderId: "ord_1",
      vendorId: "ven_1",
      amount: 1000,
      referenceId: "transfer-ref",
      status: "PENDING",
      payeeType: "MSISDN",
      payeeId: "56733123453",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    applyVendorPayoutResult.mockResolvedValue({
      ok: true,
      payout: {
        id: "vp_1",
        orderId: "ord_1",
        vendorId: "ven_1",
        amount: 1000,
        referenceId: "transfer-ref",
        status: "SUCCESS",
        payeeType: "MSISDN",
        payeeId: "56733123453",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const result = await handleMomoWebhook({
      status: "SUCCESSFUL",
      referenceId: "transfer-ref",
    });

    expect(result.outcome).toBe("transfer_success");
    expect(applyVendorPayoutResult).toHaveBeenCalledWith(
      "transfer-ref",
      "SUCCESS",
      undefined,
    );
    expect(initiateVendorPayoutForOrder).not.toHaveBeenCalled();
  });

  it("ignores unknown status", async () => {
    getPaymentByRef.mockResolvedValue(null);
    const result = await handleMomoWebhook({ status: "WEIRD" });
    expect(result.outcome).toBe("ignored");
    expect(applyProviderPaymentResult).not.toHaveBeenCalled();
  });
});
