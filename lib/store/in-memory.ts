import type {
  CreateOrderInput,
  Driver,
  MenuItem,
  Order,
  OrderStatus,
  Vendor,
} from "@/lib/types";
import type { ResettableStore } from "@/lib/store/types";
import {
  seedCategories,
  seedDrivers,
  seedMenuItems,
  seedOrders,
  seedVendor,
} from "@/lib/store/seed-data";

function cloneOrder(order: Order): Order {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    orderItems: order.orderItems.map((item) => ({
      ...item,
      menuItem: item.menuItem ? { ...item.menuItem } : undefined,
    })),
  };
}

/**
 * In-memory adapter: the demo dataset promoted to a real Store implementation.
 * State lives in this closure (one instance per process) so a single dev
 * process has one source of truth. Tests get their own instances and reset
 * between runs. ids are generated internally and must not be assumed by callers.
 */
export function createInMemoryStore(): ResettableStore {
  let menuItems: MenuItem[] = [];
  let orders: Order[] = [];
  let kitchenOpen = true;
  let orderCounter = 0;
  let orderItemCounter = 0;

  function load(): void {
    menuItems = seedMenuItems.map((item) => ({ ...item }));
    orders = seedOrders.map(cloneOrder);
    kitchenOpen = true;
    orderCounter = 0;
    orderItemCounter = 0;
  }

  load();

  async function getVendorBySlug(slug: string): Promise<Vendor | null> {
    if (slug === seedVendor.slug) return { ...seedVendor };
    return null;
  }

  async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return menuItems
      .filter((item) => item.vendorId === vendor.id)
      .map((item) => ({ ...item }));
  }

  async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
    const menu = await getMenu(vendorSlug);
    return menu.filter((item) => item.isAvailable);
  }

  async function getCategories(vendorSlug: string): Promise<string[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return [...seedCategories];
  }

  async function listOrders(vendorSlug: string): Promise<Order[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return orders
      .filter((o) => o.vendorId === vendor.id)
      .map(cloneOrder)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function listActiveOrders(vendorSlug: string): Promise<Order[]> {
    const all = await listOrders(vendorSlug);
    return all.filter((o) => o.status === "PAID" || o.status === "DISPATCHED");
  }

  async function getOrder(orderId: string): Promise<Order | null> {
    const order = orders.find((o) => o.id === orderId);
    return order ? cloneOrder(order) : null;
  }

  async function createOrder(input: CreateOrderInput): Promise<Order> {
    const vendor = await getVendorBySlug(input.vendorSlug);
    if (!vendor) throw new Error("Vendor not found");

    const menu = await getMenu(input.vendorSlug);
    const id = `ord_${++orderCounter}_${Date.now()}`;

    const orderItems = input.items.map((line) => {
      const menuItem = menu.find((m) => m.id === line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Error(`Item unavailable: ${line.menuItemId}`);
      }
      return {
        id: `oi_${++orderItemCounter}_${Date.now()}`,
        orderId: id,
        menuItemId: menuItem.id,
        menuItem: { ...menuItem },
        quantity: line.quantity,
        unitPriceRwf: menuItem.priceRwf,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceRwf,
      0
    );

    const order: Order = {
      id,
      vendorId: vendor.id,
      customerPhone: input.customerPhone,
      deliverySector: input.deliverySector,
      landmark: input.landmark,
      totalAmount,
      status: "PENDING",
      createdAt: new Date(),
      orderItems,
    };

    orders = [order, ...orders];
    return cloneOrder(order);
  }

  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null> {
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;
    orders[index] = { ...orders[index], status };
    return cloneOrder(orders[index]);
  }

  async function toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id
    );
    if (index === -1) return null;

    menuItems[index] = {
      ...menuItems[index],
      isAvailable: !menuItems[index].isAvailable,
    };
    return { ...menuItems[index] };
  }

  async function setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];

    menuItems = menuItems.map((item) =>
      item.vendorId === vendor.id ? { ...item, isAvailable: true } : item
    );
    return getMenu(vendorSlug);
  }

  async function getDrivers(vendorSlug: string): Promise<Driver[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return seedDrivers
      .filter((d) => d.vendorId === vendor.id)
      .map((d) => ({ ...d }));
  }

  async function getTodayGross(vendorSlug: string): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders
      .filter(
        (o) =>
          o.vendorId === vendor.id &&
          o.createdAt >= today &&
          (o.status === "PAID" ||
            o.status === "DISPATCHED" ||
            o.status === "COMPLETED")
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  async function isKitchenOpen(vendorSlug: string): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    return kitchenOpen && vendor.isActive;
  }

  async function setKitchenOpen(
    vendorSlug: string,
    open: boolean
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    kitchenOpen = open;
    return kitchenOpen;
  }

  function reset(): void {
    load();
  }

  return {
    getVendorBySlug,
    getMenu,
    getAvailableMenu,
    getCategories,
    toggleItemAvailability,
    setAllItemsAvailable,
    listOrders,
    listActiveOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    getDrivers,
    getTodayGross,
    isKitchenOpen,
    setKitchenOpen,
    reset,
  };
}
