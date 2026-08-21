import type { MenuItem, Order } from "@/lib/types";
import type { VendorFeatureFlags } from "@/lib/vendor/feature-and-profit-types";
import type { VendorUpdateOverview } from "@/lib/vendor-updates/types";

export interface KdsSnapshot {
  orders: Order[];
  menu: MenuItem[];
  todayGross: number;
  yesterdayGross: number;
  kitchenOpen: boolean;
  featureFlags: VendorFeatureFlags;
  vendorUpdates: VendorUpdateOverview;
}
