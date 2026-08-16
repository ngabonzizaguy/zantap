import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, upsertSiteTranslation, deleteSiteTranslation } =
  vi.hoisted(() => ({
    revalidatePath: vi.fn(),
    upsertSiteTranslation: vi.fn(),
    deleteSiteTranslation: vi.fn(),
  }));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/operator-client", () => ({
  upsertSiteTranslation,
  deleteSiteTranslation,
}));

import {
  deleteSiteTranslationAction,
  saveSiteTranslationAction,
} from "@/lib/ops-actions/site-translation-actions";

describe("site translation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves and revalidates Ops plus the marketing root", async () => {
    upsertSiteTranslation.mockResolvedValue({
      locale: "rw",
      key: "leadForm.submit",
      value: "Ohereza",
      updatedAt: new Date(),
    });

    await saveSiteTranslationAction("rw", "leadForm.submit", "Ohereza");
    expect(upsertSiteTranslation).toHaveBeenCalledWith(
      "rw",
      "leadForm.submit",
      "Ohereza"
    );
    expect(revalidatePath).toHaveBeenCalledWith("/ops/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("resets and revalidates Ops plus the marketing root", async () => {
    deleteSiteTranslation.mockResolvedValue(true);
    await deleteSiteTranslationAction("fr", "leadForm.submit");
    expect(deleteSiteTranslation).toHaveBeenCalledWith("fr", "leadForm.submit");
    expect(revalidatePath).toHaveBeenCalledWith("/ops/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
