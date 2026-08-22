import type { CustomerUpdateState } from "@/lib/customer-restaurants/types";
import type {
  PublicVendorUpdateBatch,
  PublicVendorUpdateFeedItem,
} from "@/lib/vendor-updates/types";

export type ViewedRevisionState = Pick<CustomerUpdateState, "viewedRevision">;

export interface UpdateTrayEntry {
  vendor: PublicVendorUpdateFeedItem;
  hasUnseen: boolean;
  newestPublishedAt: Date;
}

function isBatchUnseen(
  batch: PublicVendorUpdateBatch,
  states: ReadonlyMap<string, ViewedRevisionState>
): boolean {
  return batch.revision > (states.get(batch.id)?.viewedRevision ?? 0);
}

export function buildUpdateTray(
  feed: PublicVendorUpdateFeedItem[],
  states: ReadonlyMap<string, ViewedRevisionState>
): UpdateTrayEntry[] {
  return feed
    .filter((vendor) => vendor.isAvailable && vendor.batches.length > 0)
    .map((vendor) => ({
      vendor,
      hasUnseen: vendor.batches.some((batch) => isBatchUnseen(batch, states)),
      newestPublishedAt: vendor.batches[0].publishedAt,
    }))
    .sort((left, right) => {
      if (left.hasUnseen !== right.hasUnseen) return left.hasUnseen ? -1 : 1;
      return right.newestPublishedAt.getTime() - left.newestPublishedAt.getTime();
    });
}

export function chooseInitialBatchIndex(
  batches: PublicVendorUpdateBatch[],
  states: ReadonlyMap<string, ViewedRevisionState>
): number {
  const index = batches.findIndex((batch) => isBatchUnseen(batch, states));
  return index === -1 ? 0 : index;
}

export function hydratePublicUpdateFeed(
  feed: PublicVendorUpdateFeedItem[]
): PublicVendorUpdateFeedItem[] {
  return feed.map((vendor) => ({
    ...vendor,
    batches: vendor.batches.map((batch) => ({
      ...batch,
      publishedAt: new Date(batch.publishedAt),
      expiresAt: new Date(batch.expiresAt),
      entries: batch.entries.map((entry) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      })),
    })),
  }));
}
