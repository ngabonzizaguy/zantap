import { describe, expect, it } from "vitest";
import {
  buildUpdateTray,
  chooseInitialBatchIndex,
} from "@/lib/customer-restaurants/updates";
import type { PublicVendorUpdateFeedItem } from "@/lib/vendor-updates/types";

function feedItem(
  vendorId: string,
  publishedAt: string,
  revisions: number[],
  viewed: Record<string, number> = {}
) {
  const item: PublicVendorUpdateFeedItem = {
    vendorId,
    slug: vendorId,
    name: vendorId,
    isAvailable: true,
    batches: revisions.map((revision, index) => ({
      id: `${vendorId}-${index}`,
      vendorId,
      revision,
      publishedAt: new Date(new Date(publishedAt).getTime() - index * 1_000),
      expiresAt: new Date("2026-08-25T00:00:00.000Z"),
      entries: [],
    })),
  };
  return { item, viewed };
}

describe("customer update tray", () => {
  it("shows one ring per Vendor with unseen first and newest first within each group", () => {
    const unseenOlder = feedItem("unseen-older", "2026-08-21T09:00:00Z", [2]);
    const viewedNewest = feedItem("viewed-newest", "2026-08-21T12:00:00Z", [1], {
      "viewed-newest-0": 1,
    });
    const unseenNewest = feedItem("unseen-newest", "2026-08-21T11:00:00Z", [3]);

    const tray = buildUpdateTray(
      [viewedNewest.item, unseenOlder.item, unseenNewest.item],
      new Map([
        ["viewed-newest-0", { viewedRevision: 1 }],
      ])
    );

    expect(tray.map((entry) => [entry.vendor.vendorId, entry.hasUnseen])).toEqual([
      ["unseen-newest", true],
      ["unseen-older", true],
      ["viewed-newest", false],
    ]);
  });

  it("opens the newest unseen batch without clearing other unseen revisions", () => {
    const { item } = feedItem("vendor", "2026-08-21T12:00:00Z", [3, 2, 1]);
    const states = new Map([
      ["vendor-0", { viewedRevision: 3 }],
      ["vendor-1", { viewedRevision: 1 }],
    ]);

    expect(chooseInitialBatchIndex(item.batches, states)).toBe(1);
  });
});
