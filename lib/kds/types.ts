import type { MenuItem, Order } from "@/lib/types";

export interface KdsSnapshot {
  orders: Order[];
  menu: MenuItem[];
  todayGross: number;
  yesterdayGross: number;
  kitchenOpen: boolean;
}
