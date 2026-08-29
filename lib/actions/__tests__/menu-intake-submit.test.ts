import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitMenuIntake } from "@/lib/actions/menu-intake-public";
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

describe("submitMenuIntake", () => {
  beforeEach(() => {
    __resetRateLimits();
    requestHeaders.set("x-forwarded-for", "203.0.113.29");
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("returns a private browser credential and stages a Vendor question", async () => {
    const result = await submitMenuIntake({
      businessName: "Kigali Kitchen",
      contactName: "Aline",
      phone: "0781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "dish-1",
            name: "Isombe",
            category: "Main dishes",
            priceRwf: 3500,
          },
        ],
        question: "Can you help me choose the best category?",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      reference: expect.stringMatching(/^MI-[A-Z0-9-]+$/),
      resumeToken: expect.any(String),
      status: "SUBMITTED",
    });
    if (!result.ok) throw new Error("Expected success");
    expect(result.resumeToken.length).toBeGreaterThan(20);
    expect(await getStore().getMenuIntake(result.intakeId)).toMatchObject({
      intake: { status: "SUBMITTED" },
      questions: [
        {
          question: "Can you help me choose the best category?",
          status: "UNANSWERED",
        },
      ],
    });
  });
});
