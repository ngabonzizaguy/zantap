import { beforeEach, describe, expect, it } from "vitest";

import { GET, PATCH } from "@/app/api/operator/v1/leads/route";
import {
  DELETE as DELETE_ROUTING,
  GET as GET_ROUTING,
  POST as POST_ROUTING,
  PATCH as PATCH_ROUTING,
} from "@/app/api/operator/v1/lead-routing/route";
import { getStore } from "@/lib/store";
import { createInMemoryStore } from "@/lib/store/in-memory";

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

function operatorRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      Authorization: "Bearer operator-test-key",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

describe("operator lead routes", () => {
  beforeEach(() => {
    process.env.OPERATOR_API_KEY = "operator-test-key";
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("lists Leads and updates their status through the guarded route", async () => {
    const lead = await getStore().createLead({
      businessName: "Kigali Kitchen",
      businessType: "Restaurant",
      contactName: "Aline",
      phone: "0788123456",
      area: "Kimihurura",
      consentAt: new Date(),
    });

    const listResponse = await GET(
      operatorRequest("http://localhost/api/operator/v1/leads?status=NEW")
    );
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual({
      leads: [expect.objectContaining({ id: lead.id, status: "NEW" })],
    });

    const patchResponse = await PATCH(
      operatorRequest("http://localhost/api/operator/v1/leads", {
        method: "PATCH",
        body: JSON.stringify({ leadId: lead.id, status: "CONTACTED" }),
      })
    );
    expect(patchResponse.status).toBe(200);
    expect(await patchResponse.json()).toEqual({
      lead: expect.objectContaining({ id: lead.id, status: "CONTACTED" }),
    });
  });

  it("creates, reads, edits, and removes guarded WhatsApp recipients", async () => {
    const createResponse = await POST_ROUTING(
      operatorRequest("http://localhost/api/operator/v1/lead-routing", {
        method: "POST",
        body: JSON.stringify({
          name: "Primary operator",
          enabled: true,
          phone: "+250 784 928 786",
        }),
      })
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()).recipient;

    const getResponse = await GET_ROUTING(
      operatorRequest("http://localhost/api/operator/v1/lead-routing")
    );
    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual({
      recipients: [
        expect.objectContaining({
          id: created.id,
          enabled: true,
          phone: "250784928786",
        }),
      ],
    });

    const patchResponse = await PATCH_ROUTING(
      operatorRequest("http://localhost/api/operator/v1/lead-routing", {
        method: "PATCH",
        body: JSON.stringify({ recipientId: created.id, enabled: false }),
      })
    );
    expect(patchResponse.status).toBe(200);
    expect(await patchResponse.json()).toEqual({
      recipient: expect.objectContaining({ id: created.id, enabled: false }),
    });

    const deleteResponse = await DELETE_ROUTING(
      operatorRequest("http://localhost/api/operator/v1/lead-routing", {
        method: "DELETE",
        body: JSON.stringify({ recipientId: created.id }),
      })
    );
    expect(deleteResponse.status).toBe(200);
    expect(await deleteResponse.json()).toEqual({ removed: true });
  });
});
