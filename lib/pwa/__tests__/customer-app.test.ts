import { describe, expect, it } from "vitest";
import { CUSTOMER_APP_METADATA } from "@/lib/pwa/customer-app";
import { buildStorefrontManifest } from "@/lib/pwa/storefront-manifest";

describe("unified customer app migration", () => {
  it("advertises ZanTap on new storefront renders while preserving legacy storefront launch identities", () => {
    expect(CUSTOMER_APP_METADATA).toEqual(
      expect.objectContaining({
        applicationName: "ZanTap",
        manifest: "/manifest.webmanifest",
        appleWebApp: expect.objectContaining({ title: "ZanTap" }),
      })
    );

    expect(
      buildStorefrontManifest({ name: "Kigali Grill", slug: "kigali-grill" })
    ).toEqual(
      expect.objectContaining({
        id: "/kigali-grill",
        start_url: "/kigali-grill",
      })
    );
  });
});
