import { beforeEach, describe, expect, it } from "vitest";

import {
  updateOperatorLeadRoutingSettings,
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

  it("updates WhatsApp routing and audits only the recipient suffix", async () => {
    const updated = await updateOperatorLeadRoutingSettings({
      whatsappEnabled: true,
      whatsappPhone: "+250 784 928 786",
    });

    expect(updated).toMatchObject({
      whatsappEnabled: true,
      whatsappPhone: "250784928786",
    });
    expect(await getStore().listOperatorActions()).toEqual([
      expect.objectContaining({
        action: "LEAD_ROUTING_UPDATE",
        detail: expect.stringContaining('"phoneSuffix":"8786"'),
      }),
    ]);
    expect((await getStore().listOperatorActions())[0]?.detail).not.toContain(
      "250784928786"
    );
  });
});
