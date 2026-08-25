import { describe, expect, it, vi } from "vitest";
import {
  executeConfirmPin,
  executePay,
} from "@/lib/checkout/orchestration";
import type { MomoClient } from "@/lib/checkout/momo-client";
import type { Order } from "@/lib/types";

const validPayInput = {
  vendorSlug: "simba-grill",
  vendorName: "Simba Grill",
  vendor: { payoutMethod: "MERCHANT_CODE" as const, momoCode: "123456" },
  momoMode: "simulate" as const,
  lines: [
    {
      lineKey: "item-1",
      menuItemId: "item-1",
      name: "Brochettes",
      qty: 2,
      lineTotal: 4000,
    },
  ],
  phone: "0788123456",
  sector: "Kicukiro",
  landmark: "Near Simba",
  count: 2,
};

const mockOrder: Order = {
  id: "order-1",
  vendorId: "vendor-1",
  customerPhone: "0788123456",
  deliverySector: "Kicukiro",
  landmark: "Near Simba",
  totalAmount: 4000,
  status: "PENDING",
  orderItems: [],
  createdAt: new Date(),
};

function createMomoClient(
  overrides: Partial<MomoClient> = {}
): MomoClient {
  return {
    initiateStkPush: vi.fn().mockResolvedValue({
      token: "stk_test",
      status: "PENDING",
      message: "Enter PIN",
    }),
    confirmStkPin: vi.fn().mockResolvedValue({
      token: "stk_test",
      status: "SUCCESS",
      message: "Payment successful",
    }),
    ...overrides,
  };
}

describe("executePay", () => {
  it("happy path: placeOrder then STK push returns success with token", async () => {
    const placeOrder = vi.fn().mockResolvedValue(mockOrder);
    const momoClient = createMomoClient();

    const result = await executePay(
      {
        ...validPayInput,
        lines: [
          {
            lineKey: "item-1::large",
            menuItemId: "item-1",
            name: "Brochettes",
            sizeOptionId: "large",
            sizeLabel: "Large",
            qty: 2,
            lineTotal: 4000,
            notes: "Well done",
          },
        ],
      },
      { placeOrder, momoClient }
    );

    expect(result).toEqual({
      kind: "success",
      orderId: "order-1",
      stkToken: "stk_test",
    });
    expect(placeOrder).toHaveBeenCalledWith({
      vendorSlug: "simba-grill",
      customerPhone: "0788123456",
      deliverySector: "Kicukiro",
      landmark: "Near Simba",
      items: [
        {
          menuItemId: "item-1",
          quantity: 2,
          sizeOptionId: "large",
          notes: "Well done",
        },
      ],
    });
    expect(momoClient.initiateStkPush).toHaveBeenCalledWith({
      orderId: "order-1",
      phone: "0788123456",
      amount: 4000,
      vendorName: "Simba Grill",
    });
  });

  it("STK FAILED returns failed (stage should go back to cart)", async () => {
    const placeOrder = vi.fn().mockResolvedValue(mockOrder);
    const momoClient = createMomoClient({
      initiateStkPush: vi.fn().mockResolvedValue({
        token: "",
        status: "FAILED",
        message: "Declined",
      }),
    });

    const result = await executePay(validPayInput, { placeOrder, momoClient });

    expect(result).toEqual({ kind: "failed" });
  });

  it("network error on placeOrder returns failed", async () => {
    const placeOrder = vi.fn().mockRejectedValue(new Error("offline"));
    const momoClient = createMomoClient();

    const result = await executePay(validPayInput, { placeOrder, momoClient });

    expect(result).toEqual({ kind: "failed" });
    expect(momoClient.initiateStkPush).not.toHaveBeenCalled();
  });

  it("skips when validation fails", async () => {
    const placeOrder = vi.fn();
    const momoClient = createMomoClient();

    const result = await executePay(
      { ...validPayInput, count: 0 },
      { placeOrder, momoClient }
    );

    expect(result).toEqual({ kind: "skipped" });
    expect(placeOrder).not.toHaveBeenCalled();
  });

  it("manual mode returns ussd dial string after placeOrder", async () => {
    const placeOrder = vi.fn().mockResolvedValue(mockOrder);
    const momoClient = createMomoClient();
    const initManualPayment = vi.fn().mockResolvedValue({ ok: true });

    const result = await executePay(
      { ...validPayInput, momoMode: "manual" },
      { placeOrder, momoClient, initManualPayment }
    );

    expect(result.kind).toBe("manual_success");
    if (result.kind !== "manual_success") return;
    expect(result.orderId).toBe("order-1");
    expect(result.ussdDial).toBe("*182*8*1*123456*4000#");
    expect(momoClient.initiateStkPush).not.toHaveBeenCalled();
    expect(initManualPayment).toHaveBeenCalledWith("order-1", 4000);
  });

  it("manual mode blocks invalid vendor payout before placeOrder", async () => {
    const placeOrder = vi.fn();
    const momoClient = createMomoClient();

    const result = await executePay(
      {
        ...validPayInput,
        momoMode: "manual",
        vendor: { payoutMethod: "MERCHANT_CODE", momoCode: "12" },
      },
      { placeOrder, momoClient }
    );

    expect(result).toEqual({ kind: "payout_invalid" });
    expect(placeOrder).not.toHaveBeenCalled();
  });
});

describe("executeConfirmPin", () => {
  it("SUCCESS returns success (stage should go to success)", async () => {
    const momoClient = createMomoClient();

    const result = await executeConfirmPin("12345", "stk_test", momoClient);

    expect(result).toEqual({ kind: "success" });
    expect(momoClient.confirmStkPin).toHaveBeenCalledWith({
      token: "stk_test",
      pin: "12345",
    });
  });

  it("wrong PIN returns retry (stage stays on ussd)", async () => {
    const momoClient = createMomoClient({
      confirmStkPin: vi.fn().mockResolvedValue({
        token: "stk_test",
        status: "FAILED",
        message: "Invalid PIN. Please try again.",
      }),
    });

    const result = await executeConfirmPin("99999", "stk_test", momoClient);

    expect(result).toEqual({ kind: "retry" });
  });

  it("skips when pin is shorter than 5 digits", async () => {
    const momoClient = createMomoClient();

    const result = await executeConfirmPin("1234", "stk_test", momoClient);

    expect(result).toEqual({ kind: "skipped" });
    expect(momoClient.confirmStkPin).not.toHaveBeenCalled();
  });
});
