import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OnboardingChecklist } from "@/lib/vendor/onboarding";
import {
  SETUP_AUTO_OPEN_MAX,
  readSetupVisitCount,
  setupVisitStorageKey,
  shouldAutoOpenSetupDrawer,
} from "@/lib/vendor/setup-visit-cap";

const incomplete: OnboardingChecklist = {
  hasMenuItem: false,
  hasInventoryItem: false,
  hasPhoto: false,
  kitchenOpen: false,
  hasFirstOrder: false,
  hasDispatch: false,
};

const complete: OnboardingChecklist = {
  hasMenuItem: true,
  hasInventoryItem: true,
  hasPhoto: true,
  kitchenOpen: true,
  hasFirstOrder: true,
  hasDispatch: true,
};

describe("setup-visit-cap", () => {
  const slug = "test-vendor";
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });
  });

  it("returns zero visits for a fresh slug", () => {
    expect(readSetupVisitCount(slug)).toBe(0);
  });

  it("uses a slug-scoped storage key", () => {
    expect(setupVisitStorageKey(slug)).toBe(`zantap:kds-setup-visits-${slug}`);
  });

  it("auto-opens while visits are below the cap and checklist is incomplete", () => {
    localStorage.setItem(setupVisitStorageKey(slug), "1");
    expect(shouldAutoOpenSetupDrawer(slug, incomplete)).toBe(true);
  });

  it("stops auto-opening after the cap is reached", () => {
    localStorage.setItem(setupVisitStorageKey(slug), String(SETUP_AUTO_OPEN_MAX));
    expect(shouldAutoOpenSetupDrawer(slug, incomplete)).toBe(false);
  });

  it("never auto-opens when the checklist is complete", () => {
    expect(shouldAutoOpenSetupDrawer(slug, complete)).toBe(false);
  });
});
