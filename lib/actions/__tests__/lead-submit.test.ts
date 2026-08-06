import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitLead } from "@/lib/actions/lead-submit";
import { getStore } from "@/lib/store";
import { createInMemoryStore } from "@/lib/store/in-memory";
import { __resetRateLimits } from "@/lib/vendor/rate-limit";

const requestHeaders = vi.hoisted(() => new Headers());

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => requestHeaders),
}));

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

describe("submitLead", () => {
  beforeEach(() => {
    __resetRateLimits();
    requestHeaders.delete("x-forwarded-for");
    requestHeaders.set("x-forwarded-for", "203.0.113.10");
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("persists a valid marketing lead through the Store seam", async () => {
    const result = await submitLead({
      businessName: "  Kigali Kitchen  ",
      businessType: "Restaurant",
      contactName: "  Aline  ",
      phone: "0788 123 456",
      area: "  Kimihurura  ",
      source: "marketing-root",
    });

    expect(result).toEqual({ ok: true });
    expect(await getStore().listLeads()).toEqual([
      expect.objectContaining({
        businessName: "Kigali Kitchen",
        contactName: "Aline",
        phone: "250788123456",
        area: "Kimihurura",
        status: "NEW",
        source: "marketing-root",
      }),
    ]);
  });

  it("rejects incomplete or invalid-phone submissions without persisting", async () => {
    const incomplete = await submitLead({
      businessName: "",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "0788123456",
      area: "Kigali",
    });
    const invalidPhone = await submitLead({
      businessName: "Kigali Kitchen",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "12345",
      area: "Kigali",
    });

    expect(incomplete).toEqual({ ok: false, error: "INVALID_INPUT" });
    expect(invalidPhone).toEqual({ ok: false, error: "INVALID_PHONE" });
    expect(await getStore().listLeads()).toHaveLength(0);
  });

  it("silently discards submissions that fill the honeypot", async () => {
    const result = await submitLead({
      businessName: "Spam Kitchen",
      businessType: "Restaurant",
      contactName: "Robot",
      phone: "0788123456",
      area: "Kigali",
      website: "https://spam.example",
    });

    expect(result).toEqual({ ok: true });
    expect(await getStore().listLeads()).toHaveLength(0);
  });

  it("rate-limits repeated submissions from the same phone", async () => {
    const input = {
      businessName: "Kigali Kitchen",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "0788123456",
      area: "Kigali",
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(submitLead(input)).resolves.toEqual({ ok: true });
    }
    await expect(submitLead(input)).resolves.toEqual({
      ok: false,
      error: "RATE_LIMITED",
    });
    expect(await getStore().listLeads()).toHaveLength(3);
  });

  it("rate-limits bursts from the same IP across different phones", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(
        submitLead({
          businessName: `Kitchen ${attempt}`,
          businessType: "Restaurant",
          contactName: "Aline",
          phone: `0788${String(attempt).padStart(6, "0")}`,
          area: "Kigali",
        })
      ).resolves.toEqual({ ok: true });
    }

    await expect(
      submitLead({
        businessName: "Kitchen over limit",
        businessType: "Restaurant",
        contactName: "Aline",
        phone: "0788999999",
        area: "Kigali",
      })
    ).resolves.toEqual({ ok: false, error: "RATE_LIMITED" });
    expect(await getStore().listLeads()).toHaveLength(10);
  });
});
