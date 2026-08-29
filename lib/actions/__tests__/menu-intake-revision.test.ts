import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  submitMenuIntake,
  submitMenuIntakeRevision,
} from "@/lib/actions/menu-intake-public";
import { getStore } from "@/lib/store";
import { createInMemoryStore } from "@/lib/store/in-memory";
import { __resetRateLimits } from "@/lib/vendor/rate-limit";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

const firstContent = {
  path: "SELF_BUILD" as const,
  dishes: [
    {
      clientId: "dish-1",
      name: "Isombe",
      category: "Main dishes",
      priceRwf: 3500,
    },
  ],
};

describe("Menu intake revisions", () => {
  beforeEach(() => {
    __resetRateLimits();
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("appends an immutable correction only with the private browser credential", async () => {
    const submitted = await submitMenuIntake({
      businessName: "Kigali Kitchen",
      contactName: "Aline",
      phone: "0781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: firstContent,
    });
    if (!submitted.ok) throw new Error("Expected initial submission");

    await expect(
      submitMenuIntakeRevision(submitted.intakeId, "wrong-token", {
        ...firstContent,
        dishes: [{ ...firstContent.dishes[0], priceRwf: 4000 }],
      }),
    ).resolves.toEqual({ ok: false, error: "INVALID_ACCESS" });

    await expect(
      submitMenuIntakeRevision(submitted.intakeId, submitted.resumeToken, {
        ...firstContent,
        dishes: [{ ...firstContent.dishes[0], priceRwf: 4000 }],
      }),
    ).resolves.toMatchObject({ ok: true, revision: 2 });

    const detail = await getStore().getMenuIntake(submitted.intakeId);
    expect(detail?.revisions).toHaveLength(2);
    expect(
      detail?.revisions.map((revision) => revision.content.dishes[0]?.priceRwf),
    ).toEqual([3500, 4000]);
  });
});
