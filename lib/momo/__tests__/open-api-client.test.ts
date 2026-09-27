import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isValidMomoNote,
  sanitizeMomoNote,
} from "@/lib/momo/open-api-notes";
import { createMomoOpenApiClient } from "@/lib/momo/open-api-client";
import type { MomoOpenApiConfig } from "@/lib/momo/open-api-config";
import { vendorPayeeFromPayout } from "@/lib/momo/vendor-payee";

const testConfig: MomoOpenApiConfig = {
  environment: "sandbox",
  baseUrl: "https://sandbox.momodeveloper.mtn.com",
  webhookUrl: "https://example.ngrok-free.app/api/momo/webhook" as string | null,
  currency: "EUR",
  targetEnvironment: "sandbox",
  sandboxSuccessMsisdn: "56733123453",
  collection: {
    primaryKey: "col-primary",
    userId: "col-user",
    apiKey: "col-key",
  },
  disbursement: {
    primaryKey: "dis-primary",
    userId: "dis-user",
    apiKey: "dis-key",
  },
};

describe("sanitizeMomoNote", () => {
  it("strips # and other special characters", () => {
    expect(sanitizeMomoNote("Order #123")).toBe("Order 123");
    expect(isValidMomoNote(sanitizeMomoNote("Order #123"))).toBe(true);
  });

  it("caps length at 160", () => {
    const long = "a".repeat(200);
    expect(sanitizeMomoNote(long).length).toBe(160);
  });

  it("falls back when empty after sanitize", () => {
    expect(sanitizeMomoNote("!!!")).toBe("ZanTap");
  });
});

describe("vendorPayeeFromPayout", () => {
  it("maps PHONE to MSISDN digits", () => {
    expect(
      vendorPayeeFromPayout({
        payoutMethod: "PHONE",
        momoCode: "+250 788 123 456",
      }),
    ).toEqual({ partyIdType: "MSISDN", partyId: "250788123456" });
  });

  it("maps MERCHANT_CODE to PARTY_CODE", () => {
    expect(
      vendorPayeeFromPayout({
        payoutMethod: "MERCHANT_CODE",
        momoCode: "880001",
      }),
    ).toEqual({ partyIdType: "PARTY_CODE", partyId: "880001" });
  });
});

describe("createMomoOpenApiClient", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("caches bearer tokens and sends requesttopay with sandbox rules", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "tok-1", expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 202 }));

    const client = createMomoOpenApiClient({
      config: testConfig,
      fetchFn: fetchFn as unknown as typeof fetch,
      now: () => 1_000_000,
    });

    const accepted = await client.requestToPay({
      amount: 1000,
      externalId: "order_abc",
      referenceId: "11111111-1111-4111-8111-111111111111",
      payer: { partyIdType: "MSISDN", partyId: "56733123453" },
      payerMessage: "Order #99",
      payeeNote: "Pay vendor!",
    });

    expect(accepted.status).toBe(202);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    const tokenCall = fetchFn.mock.calls[0];
    expect(String(tokenCall[0])).toContain("/collection/token/");
    expect(tokenCall[1].headers.Authorization).toMatch(/^Basic /);

    const payCall = fetchFn.mock.calls[1];
    expect(String(payCall[0])).toContain("/collection/v1_0/requesttopay");
    expect(payCall[1].headers["X-Reference-Id"]).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(payCall[1].headers["X-Target-Environment"]).toBe("sandbox");
    expect(payCall[1].headers["X-Callback-Url"]).toBe(testConfig.webhookUrl);

    const body = JSON.parse(payCall[1].body as string) as {
      currency: string;
      payerMessage: string;
      payeeNote: string;
      amount: string;
    };
    expect(body.currency).toBe("EUR");
    expect(body.amount).toBe("1000");
    expect(body.payerMessage).toBe("Order 99");
    expect(body.payeeNote).toBe("Pay vendor");
    expect(isValidMomoNote(body.payerMessage)).toBe(true);

    // Second call should reuse token
    fetchFn.mockResolvedValueOnce(new Response(null, { status: 202 }));
    await client.requestToPay({
      amount: 5,
      externalId: "order_2",
      payer: { partyIdType: "MSISDN", partyId: "56733123453" },
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("sends dynamic payee on transfer", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "tok-dis", expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 202 }));

    const client = createMomoOpenApiClient({
      config: testConfig,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    client.clearTokenCache();

    await client.transfer({
      amount: 950,
      externalId: "order_abc",
      payee: { partyIdType: "PARTY_CODE", partyId: "880001" },
    });

    const transferCall = fetchFn.mock.calls[1];
    expect(String(transferCall[0])).toContain("/disbursement/v1_0/transfer");
    const body = JSON.parse(transferCall[1].body as string) as {
      payee: { partyIdType: string; partyId: string };
      currency: string;
    };
    expect(body.currency).toBe("EUR");
    expect(body.payee).toEqual({
      partyIdType: "PARTY_CODE",
      partyId: "880001",
    });
  });
});
