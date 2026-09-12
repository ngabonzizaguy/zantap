import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ops-auth/session", () => ({ isOpsSessionValid: vi.fn() }));
vi.mock("@/lib/operator-client", () => ({ upsertSiteTranslation: vi.fn(), deleteSiteTranslation: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { isOpsSessionValid } from "@/lib/ops-auth/session";
import { upsertSiteTranslation, deleteSiteTranslation } from "@/lib/operator-client";
import { revalidatePath } from "next/cache";
import { saveSiteTranslationAction, deleteSiteTranslationAction } from "@/lib/ops-actions/site-translation-actions";

describe("translation server actions", () => {
  beforeEach(() => vi.resetAllMocks());

  it("rejects unauthenticated mutations before using the operator credential", async () => {
    vi.mocked(isOpsSessionValid).mockResolvedValue(false);
    await expect(saveSiteTranslationAction("fr", "kds.tabs.orders", "Commandes")).rejects.toThrow("sign in");
    await expect(deleteSiteTranslationAction("fr", "kds.tabs.orders")).rejects.toThrow("sign in");
    expect(upsertSiteTranslation).not.toHaveBeenCalled();
    expect(deleteSiteTranslation).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("allows authenticated save and reset and invalidates KDS rendering", async () => {
    vi.mocked(isOpsSessionValid).mockResolvedValue(true);
    await saveSiteTranslationAction("fr", "kds.tabs.orders", "Commandes");
    await deleteSiteTranslationAction("fr", "kds.tabs.orders");
    expect(upsertSiteTranslation).toHaveBeenCalledWith("fr", "kds.tabs.orders", "Commandes");
    expect(deleteSiteTranslation).toHaveBeenCalledWith("fr", "kds.tabs.orders");
    expect(revalidatePath).toHaveBeenCalledWith("/vendor/[slug]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/ops/settings");
  });
});
