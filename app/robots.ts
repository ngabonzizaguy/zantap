import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";

/**
 * Crawl policy (ADR-0049): the marketing root and vendor storefronts
 * (`/[slug]`) are deliberately crawlable — storefronts are each vendor's
 * public web presence. Operational surfaces (KDS, ops console, delivery
 * slips, API) are excluded.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/ops", "/vendor/", "/slip/"],
      },
    ],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
