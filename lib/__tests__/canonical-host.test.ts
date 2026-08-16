import { describe, expect, it } from "vitest";
// @ts-expect-error Next config is JavaScript and intentionally has no declaration file.
import nextConfig from "../../next.config.mjs";

type Redirect = { has?: Array<{ type: string; value: string }> };

describe("canonical production host", () => {
  it("permanently redirects the legacy psi alias while preserving the path", async () => {
    const redirects = await nextConfig.redirects();

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "zantap-psi.vercel.app" }],
      destination: "https://zantap.app/:path*",
      permanent: true,
    });
  });

  it("does not claim preview or local hosts", async () => {
    const redirects = await nextConfig.redirects();
    const configuredHosts = (redirects as Redirect[]).flatMap((redirect) =>
      (redirect.has ?? [])
        .filter((condition: { type: string }) => condition.type === "host")
        .map((condition: { value: string }) => condition.value)
    );

    expect(configuredHosts).toEqual(["zantap-psi.vercel.app"]);
    expect(configuredHosts).not.toContain("localhost");
    expect(configuredHosts).not.toContain("*.vercel.app");
  });
});
