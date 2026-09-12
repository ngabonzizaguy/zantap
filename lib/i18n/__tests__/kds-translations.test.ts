import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInMemoryStore } from "@/lib/store/in-memory";
import { getStore } from "@/lib/store";
import { getKdsTranslations } from "@/lib/i18n/get-kds-translations";
import { createKdsTranslator, selectKdsTranslations } from "@/lib/i18n/kds-localize";
import { KdsLanguageProvider } from "@/components/vendor/KdsLanguageProvider";
import { Tabs } from "@/components/vendor/Tabs";
import {
  getKdsExpenseCategoryOptions,
  translateKdsLabel,
  translateKdsStatus,
} from "@/lib/i18n/kds-labels";
import { formatKdsRelativeTime } from "@/lib/i18n/kds-time";
import { deleteOperatorSiteTranslation, upsertOperatorSiteTranslation } from "@/lib/operator-control/site-translations";

const globalForStore = globalThis as unknown as { __zantapStore?: ReturnType<typeof createInMemoryStore> };
const TestKdsLanguageProvider = KdsLanguageProvider as (
  props: Omit<ComponentProps<typeof KdsLanguageProvider>, "children"> & {
    children?: ReactNode;
  }
) => ReactNode;

describe("KDS translations", () => {
  beforeEach(() => { globalForStore.__zantapStore = createInMemoryStore(); });

  it("renders a saved override in KDS and restores English after reset", async () => {
    await upsertOperatorSiteTranslation("fr", "kds.tabs.orders", "Commandes");
    await upsertOperatorSiteTranslation("fr", "hero.headline", "Marketing only");
    const dictionaries = await getKdsTranslations();
    expect(Object.keys(dictionaries.fr!)).toEqual(["kds.tabs.orders"]);
    const markup = renderToStaticMarkup(
      createElement(
        TestKdsLanguageProvider,
        { initialLocale: "fr", translations: dictionaries },
        createElement(Tabs, {
          active: "orders",
          onOrders() {},
          onMenu() {},
          onHistory() {},
          onInventory() {},
        })
      )
    );
    expect(markup).toContain('lang="fr"');
    expect(markup).toContain("Commandes");
    expect(markup).toContain("Inventory");
    expect(markup).not.toContain("Marketing only");
    await deleteOperatorSiteTranslation("fr", "kds.tabs.orders");
    expect(createKdsTranslator((await getKdsTranslations()).fr)("kds.tabs.orders")).toBe("Orders");
    expect((await getStore().listSiteTranslations("fr"))[0].key).toBe("hero.headline");
  });

  it("rejects missing or invented placeholders but allows reordered sentences", async () => {
    await expect(upsertOperatorSiteTranslation("rw", "kds.counts.page", "Page {page}")).rejects.toThrow("placeholder");
    await expect(upsertOperatorSiteTranslation("rw", "kds.counts.page", "{page} {pages} {secret}")).rejects.toThrow("placeholder");
    await upsertOperatorSiteTranslation("fr", "kds.counts.page", "Sur {pages} pages : {page}");
    const t = createKdsTranslator((await getKdsTranslations()).fr);
    expect(t("kds.counts.page", { page: 2, pages: 4 })).toBe("Sur 4 pages : 2");
    await expect(upsertOperatorSiteTranslation("fr", "kds.orders.internal-status", "NEW")).rejects.toThrow("Unknown copy key");
  });

  it("keeps locales independent and discards malformed or unregistered rows", () => {
    const dictionaries = selectKdsTranslations([
      { locale: "rw", key: "kds.tabs.orders", value: "Ibyatumijwe" },
      { locale: "fr", key: "kds.tabs.orders", value: "Commandes" },
      { locale: "de", key: "kds.tabs.orders", value: "Invalid locale" },
      { locale: "rw", key: "kds.internal.secret", value: "Ignore" },
      { locale: "rw", key: "kds.counts.page", value: "Missing numbers" },
    ]);
    expect(createKdsTranslator(dictionaries.rw)("kds.tabs.orders")).toBe("Ibyatumijwe");
    expect(createKdsTranslator(dictionaries.fr)("kds.tabs.orders")).toBe("Commandes");
    expect(Object.keys(dictionaries.rw!)).toEqual(["kds.tabs.orders"]);
    expect(createKdsTranslator(dictionaries.rw)("kds.counts.page", { page: 1, pages: 3 })).toBe("Page 1 of 3");
  });

  it("falls back when copy storage fails and translates display stages without changing values", async () => {
    vi.spyOn(getStore(), "listSiteTranslations").mockRejectedValueOnce(new Error("Storage unavailable"));
    expect(await getKdsTranslations()).toEqual({});
    const t = createKdsTranslator({ "kds.status.preparing": "En préparation", "kds.time.minutes": "Il y a {count} min" });
    expect(translateKdsStatus(t, "PREPARING")).toBe("En préparation");
    expect(formatKdsRelativeTime(t, new Date("2026-09-10T10:00:00Z"), new Date("2026-09-10T10:05:00Z"))).toBe("Il y a 5 min");
  });

  it("registers readiness, guided setup, and update metrics as editable KDS copy", async () => {
    await upsertOperatorSiteTranslation(
      "rw",
      "kds.readiness-guide.welcome-to-your-kitchen",
      "Murakaza mu gikoni cyanyu"
    );
    await upsertOperatorSiteTranslation(
      "rw",
      "kds.setup-drawer.next-step",
      "Ibikurikira · {label} →"
    );
    await upsertOperatorSiteTranslation(
      "rw",
      "kds.vendor-updates-panel.menu-visits",
      "Abasuye menu"
    );
    await upsertOperatorSiteTranslation("rw", "kds.labels.logo-added", "Ikirango cyongewemo");

    const t = createKdsTranslator((await getKdsTranslations()).rw);
    expect(t("kds.readiness-guide.welcome-to-your-kitchen")).toBe(
      "Murakaza mu gikoni cyanyu"
    );
    expect(t("kds.setup-drawer.next-step", { label: "Ikirango" })).toBe(
      "Ibikurikira · Ikirango →"
    );
    expect(t("kds.vendor-updates-panel.menu-visits")).toBe("Abasuye menu");
    expect(translateKdsLabel(t, "Logo added")).toBe("Ikirango cyongewemo");
  });

  it("translates expense labels without changing persisted category values", () => {
    const t = createKdsTranslator({
      "kds.labels.ingredients": "Ingrédients",
    });
    const ingredients = getKdsExpenseCategoryOptions(t)[0];

    expect(ingredients).toEqual({
      value: "Ingredients",
      label: "Ingrédients",
    });
  });
});
