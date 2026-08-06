import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatStorefrontDisplayPath,
  getBaseUrl,
  getDisplayHostPrefix,
  getStorefrontUrl,
} from "@/lib/base-url";

describe("getBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("prefers NEXT_PUBLIC_BASE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://zantap.app/");
    expect(getBaseUrl()).toBe("https://zantap.app");
  });

  it("falls back to window.location.origin when env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });
});

describe("getDisplayHostPrefix", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("strips protocol for display prefixes", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://zantap.app");
    expect(getDisplayHostPrefix()).toBe("zantap.app/");
  });

  it("includes port for local origins", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
    expect(getDisplayHostPrefix()).toBe("localhost:3000/");
  });
});

describe("getStorefrontUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("builds a full storefront URL from configured origin", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://zantap.app");
    expect(getStorefrontUrl("inka-steakhouse")).toBe(
      "https://zantap.app/inka-steakhouse"
    );
  });

  it("normalizes a leading slash on the slug", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://zantap.app");
    expect(getStorefrontUrl("/inka-steakhouse")).toBe(
      "https://zantap.app/inka-steakhouse"
    );
  });
});

describe("formatStorefrontDisplayPath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("drops the protocol for compact copy", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://zantap.app");
    expect(formatStorefrontDisplayPath("inka-steakhouse")).toBe(
      "zantap.app/inka-steakhouse"
    );
  });
});
