import { describe, expect, it } from "vitest";
import { GET } from "@/app/vendor/[slug]/manifest.webmanifest/route";

describe("KDS PWA manifest", () => {
  it("keeps the installed kitchen app scoped to its encoded vendor route", async () => {
    const response = await GET(
      new Request(
        "http://localhost/vendor/kigali%20grill/manifest.webmanifest"
      ),
      { params: Promise.resolve({ slug: "kigali grill" }) }
    );
    const manifest = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/manifest+json"
    );
    expect(manifest).toEqual(
      expect.objectContaining({
        id: "/vendor/kigali%20grill",
        start_url: "/vendor/kigali%20grill",
        scope: "/vendor/kigali%20grill",
        display: "standalone",
      })
    );
  });
});
