import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteOperatorSiteTranslation,
  listOperatorSiteTranslations,
  upsertOperatorSiteTranslation,
} from "@/lib/operator-control/site-translations";
import { getStore } from "@/lib/store";
import { createInMemoryStore } from "@/lib/store/in-memory";

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

describe("operator site translations", () => {
  beforeEach(() => {
    globalForStore.__zantapStore = createInMemoryStore();
  });

  it("saves and deletes an allow-listed override with audit entries", async () => {
    const saved = await upsertOperatorSiteTranslation(
      "rw",
      "leadForm.submit",
      "Ohereza"
    );
    expect(saved).toMatchObject({
      locale: "rw",
      key: "leadForm.submit",
      value: "Ohereza",
    });
    expect(await listOperatorSiteTranslations("rw")).toHaveLength(1);

    expect(await deleteOperatorSiteTranslation("rw", "leadForm.submit")).toBe(true);
    expect(await listOperatorSiteTranslations("rw")).toEqual([]);

    const actions = await getStore().listOperatorActions();
    expect(actions.map((action) => action.action)).toEqual([
      "SITE_TRANSLATION_DELETE",
      "SITE_TRANSLATION_UPSERT",
    ]);
    expect(actions.every((action) => !action.detail?.includes("Ohereza"))).toBe(true);
  });

  it("rejects unknown locales, keys, and empty values", async () => {
    await expect(
      upsertOperatorSiteTranslation("de", "leadForm.submit", "Senden")
    ).rejects.toThrow("Unknown locale");
    await expect(
      upsertOperatorSiteTranslation("rw", "leadForm.secret", "No")
    ).rejects.toThrow("Unknown copy key");
    await expect(
      upsertOperatorSiteTranslation("rw", "leadForm.submit", "   ")
    ).rejects.toThrow("Value cannot be empty");
  });
});
