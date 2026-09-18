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

  it("persists a valid international Lead from national or complete international input", async () => {
    const national = await submitLead({
      businessName: "London Kitchen",
      businessType: "Restaurant",
      contactName: "Amara",
      phone: "07123 456789",
      phoneCountry: "GB",
      area: "Kigali",
    });
    const complete = await submitLead({
      businessName: "San Francisco Kitchen",
      businessType: "Restaurant",
      contactName: "Maya",
      phone: "+1 415 555 2671",
      phoneCountry: "RW",
      area: "Kigali",
    });

    expect(national).toEqual({ ok: true });
    expect(complete).toEqual({ ok: true });
    expect(
      (await getStore().listLeads()).map((lead) => lead.phone).sort()
    ).toEqual(["14155552671", "447123456789"]);
  });

  it("returns a configured WhatsApp handoff after the lead is durably stored", async () => {
    const recipient = await getStore().createLeadRoutingRecipient({
      name: "Primary operator",
      phone: "0784 928 786",
      enabled: true,
    });

    const result = await submitLead({
      businessName: "Kigali Kitchen",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "0788 123 456",
      area: "Kimihurura",
      source: "marketing-root",
    });

    const stored = await getStore().listLeads();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.routingAssignment).toMatchObject({
      recipientId: recipient.id,
      recipientPhone: "250784928786",
    });
    expect(result).toEqual({
      ok: true,
      whatsappUrl: expect.stringMatching(
        /^https:\/\/wa\.me\/250784928786\?text=/
      ),
    });
    expect(decodeURIComponent(result.ok ? result.whatsappUrl ?? "" : "")).toContain(
      "Kigali Kitchen"
    );
  });

  it("returns one round-robin WhatsApp action per persisted Lead", async () => {
    await getStore().createLeadRoutingRecipient({
      name: "First operator",
      phone: "0784 928 786",
      enabled: true,
    });
    await getStore().createLeadRoutingRecipient({
      name: "Second operator",
      phone: "0788 000 222",
      enabled: true,
    });

    const first = await submitLead({
      businessName: "First Bistro",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "0788 123 456",
      area: "Kigali",
    });
    const second = await submitLead({
      businessName: "Second Bistro",
      businessType: "Restaurant",
      contactName: "Eric",
      phone: "0788 123 457",
      area: "Kigali",
    });

    expect(first).toMatchObject({
      ok: true,
      whatsappUrl: expect.stringMatching(/^https:\/\/wa\.me\/250784928786\?/),
    });
    expect(second).toMatchObject({
      ok: true,
      whatsappUrl: expect.stringMatching(/^https:\/\/wa\.me\/250788000222\?/),
    });
    expect(await getStore().listLeads()).toHaveLength(2);
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
