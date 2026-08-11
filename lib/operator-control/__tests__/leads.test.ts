import { beforeEach, describe, expect, it } from "vitest";

import {
  createOperatorLeadRoutingRecipient,
  removeOperatorLeadRoutingRecipient,
  updateOperatorLeadRoutingRecipient,
  updateOperatorLeadStatus,
} from "@/lib/operator-control/leads";
import { getStore } from "@/lib/store";
import { createInMemoryStore } from "@/lib/store/in-memory";

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

describe("operator lead controls", () => {
  beforeEach(() => {
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("updates a Lead status and records a platform audit action", async () => {
    const lead = await getStore().createLead({
      businessName: "Kigali Kitchen",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "0788123456",
      area: "Kimihurura",
      consentAt: new Date(),
    });

    const updated = await updateOperatorLeadStatus(lead.id, "CONTACTED");

    expect(updated?.status).toBe("CONTACTED");
    expect(await getStore().listOperatorActions()).toEqual([
      expect.objectContaining({
        action: "LEAD_STATUS_UPDATE",
        detail: expect.stringContaining(lead.id),
      }),
    ]);
  });

  it("creates a WhatsApp routing recipient and audits only its suffix", async () => {
    const created = await createOperatorLeadRoutingRecipient({
      name: "Primary operator",
      enabled: true,
      phone: "+250 784 928 786",
    });

    expect(created).toMatchObject({
      name: "Primary operator",
      enabled: true,
      phone: "250784928786",
    });
    expect(await getStore().listOperatorActions()).toEqual([
      expect.objectContaining({
        action: "LEAD_ROUTING_RECIPIENT_CREATE",
        detail: expect.stringContaining('"phoneSuffix":"8786"'),
      }),
    ]);
    expect((await getStore().listOperatorActions())[0]?.detail).not.toContain(
      "250784928786"
    );
  });

  it("edits, disables, and removes recipients with audited mutations", async () => {
    const created = await createOperatorLeadRoutingRecipient({
      name: "Temporary operator",
      enabled: true,
      phone: "0788 000 222",
    });

    const updated = await updateOperatorLeadRoutingRecipient(created.id, {
      name: "Unavailable operator",
      enabled: false,
    });
    expect(updated).toMatchObject({
      name: "Unavailable operator",
      enabled: false,
    });
    expect(await removeOperatorLeadRoutingRecipient(created.id)).toBe(true);
    expect(await getStore().listLeadRoutingRecipients()).toEqual([]);

    const actions = await getStore().listOperatorActions();
    expect(actions.map((action) => action.action)).toEqual(
      expect.arrayContaining([
        "LEAD_ROUTING_RECIPIENT_REMOVE",
        "LEAD_ROUTING_RECIPIENT_UPDATE",
        "LEAD_ROUTING_RECIPIENT_CREATE",
      ])
    );
    expect(actions).toHaveLength(3);
    expect(actions.every((action) => !action.detail?.includes("250788000222"))).toBe(
      true
    );
  });
});
