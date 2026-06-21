import {
  mockCategories,
  mockDrivers,
  mockMenuItems,
  mockOrders,
  mockVendor,
} from "@/lib/data/mock";
import type {
  CreateOrderInput,
  Driver,
  MenuItem,
  Order,
  OrderStatus,
  Vendor,
} from "@/lib/types";

// In-memory mutable store (swap for Prisma later)
let menuItems = [...mockMenuItems];
let orders = [...mockOrders];
let kitchenOpen = true;

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

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  if (slug === mockVendor.slug) return { ...mockVendor };
  return null;
}

export async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return [];
  return menuItems
    .filter((item) => item.vendorId === vendor.id)
    .map((item) => ({ ...item }));
}

export async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
  const menu = await getMenu(vendorSlug);
  return menu.filter((item) => item.isAvailable);
}

export async function getCategories(vendorSlug: string): Promise<string[]> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return [];
  return mockCategories;
}

export async function listOrders(vendorSlug: string): Promise<Order[]> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return [];
  return orders
    .filter((o) => o.vendorId === vendor.id)
    .map(cloneOrder)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listActiveOrders(vendorSlug: string): Promise<Order[]> {
  const all = await listOrders(vendorSlug);
  return all.filter((o) => o.status === "PAID" || o.status === "DISPATCHED");
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const order = orders.find((o) => o.id === orderId);
  return order ? cloneOrder(order) : null;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const vendor = await getVendorBySlug(input.vendorSlug);
  if (!vendor) throw new Error("Vendor not found");

  const menu = await getMenu(input.vendorSlug);
  const orderItems = input.items.map((line, index) => {
    const menuItem = menu.find((m) => m.id === line.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      throw new Error(`Item unavailable: ${line.menuItemId}`);
    }
    return {
      id: `oi_new_${Date.now()}_${index}`,
      orderId: "",
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

  const id = String(1200 + orders.length + 1);
  const order: Order = {
    id,
    vendorId: vendor.id,
    customerPhone: input.customerPhone,
    deliverySector: input.deliverySector,
    landmark: input.landmark,
    totalAmount,
    status: "PENDING",
    createdAt: new Date(),
    orderItems: orderItems.map((item) => ({ ...item, orderId: id })),
  };

  orders = [order, ...orders];
  return cloneOrder(order);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order | null> {
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;
  orders[index] = { ...orders[index], status };
  return cloneOrder(orders[index]);
}

export async function toggleItemAvailability(
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

export async function setAllItemsAvailable(
  vendorSlug: string
): Promise<MenuItem[]> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return [];

  menuItems = menuItems.map((item) =>
    item.vendorId === vendor.id ? { ...item, isAvailable: true } : item
  );
  return getMenu(vendorSlug);
}

export async function getDrivers(vendorSlug: string): Promise<Driver[]> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return [];
  return mockDrivers
    .filter((d) => d.vendorId === vendor.id)
    .map((d) => ({ ...d }));
}

export async function getTodayGross(vendorSlug: string): Promise<number> {
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

export async function isKitchenOpen(vendorSlug: string): Promise<boolean> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return false;
  return kitchenOpen && vendor.isActive;
}

export async function setKitchenOpen(
  vendorSlug: string,
  open: boolean
): Promise<boolean> {
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return false;
  kitchenOpen = open;
  return kitchenOpen;
}

// Reset helper for tests/dev
export function resetMockStore(): void {
  menuItems = [...mockMenuItems];
  orders = [...mockOrders];
  kitchenOpen = true;
}
