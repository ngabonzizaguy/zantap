import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PublicCustomerImage,
  publicCustomerImageSrc,
} from "@/components/customer/PublicCustomerImage";

describe("public customer images", () => {
  it("renders an approved public HTTPS URL without requiring a hostname allow-list", () => {
    const src =
      "https://remote-image-regression.public.blob.vercel-storage.com/logo.png";

    const markup = renderToStaticMarkup(
      createElement(PublicCustomerImage, {
        src,
        alt: "Vendor logo",
        width: 44,
        height: 44,
        className: "object-cover",
        fallback: "V",
      })
    );

    expect(markup).toContain(`src="${src}"`);
    expect(markup).not.toContain("/_next/image");
  });

  it("accepts same-origin paths and arbitrary HTTPS hosts", () => {
    expect(publicCustomerImageSrc("/api/local-blob/vendor/logo.png")).toBe(
      "/api/local-blob/vendor/logo.png"
    );
    expect(publicCustomerImageSrc("https://images.vendor-cdn.example/dish.jpg")).toBe(
      "https://images.vendor-cdn.example/dish.jpg"
    );
  });

  it.each([
    "http://images.vendor.example/logo.png",
    "//images.vendor.example/logo.png",
    "data:image/png;base64,abc",
    "javascript:alert(1)",
    "https://user:password@images.vendor.example/logo.png",
    "not a URL",
  ])("rejects unsupported public image source %s", (src) => {
    expect(publicCustomerImageSrc(src)).toBeNull();
  });

  it("renders the supplied fallback for a rejected source", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicCustomerImage, {
        src: "http://images.vendor.example/logo.png",
        alt: "Vendor logo",
        width: 44,
        height: 44,
        className: "object-cover",
        fallback: createElement("span", null, "V"),
      })
    );

    expect(markup).toBe("<span>V</span>");
  });
});
