import "server-only";

import type {
  Driver as PrismaDriver,
  MenuItem as PrismaMenuItem,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Prisma,
  PrismaClient,
  Vendor as PrismaVendor,
} from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/prisma";
import type { Store } from "@/lib/store/types";
import type {
  CreateOrderInput,
  Driver,
  MenuItem,
  Order,
  OrderStatus,
  Vendor,
} from "@/lib/types";

// Statuses that count toward a vendor's gross takings for the day.
const COUNTED_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];
const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED"];

type PrismaOrderWithItems = PrismaOrder & {
  orderItems: (PrismaOrderItem & { menuItem: PrismaMenuItem })[];
};

function mapVendor(vendor: PrismaVendor): Vendor {
  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    phoneNumber: vendor.phoneNumber,
    momoCode: vendor.momoCode,
    isActive: vendor.isActive,
    tagline: vendor.tagline ?? undefined,
    location: vendor.location ?? undefined,
    deliveryTime: vendor.deliveryTime ?? undefined,
    rating: vendor.rating ?? undefined,
    createdAt: vendor.createdAt,
  };
}

function mapMenuItem(item: PrismaMenuItem): MenuItem {
  return {
    id: item.id,
    vendorId: item.vendorId,
    name: item.name,
    description: item.description ?? undefined,
    priceRwf: item.priceRwf,
    imageUrl: item.imageUrl ?? undefined,
    category: item.category,
    isAvailable: item.isAvailable,
    thumbFrom: item.thumbFrom ?? undefined,
    thumbTo: item.thumbTo ?? undefined,
  };
}

function mapDriver(driver: PrismaDriver): Driver {
  return {
    id: driver.id,
    vendorId: driver.vendorId,
    name: driver.name,
    phone: driver.phone,
    initials: driver.initials,
    hue: driver.hue,
  };
}

function mapOrder(order: PrismaOrderWithItems): Order {
  return {
    id: order.id,
    vendorId: order.vendorId,
    customerPhone: order.customerPhone,
    deliverySector: order.deliverySector,
    landmark: order.landmark,
    totalAmount: order.totalAmount,
    status: order.status as OrderStatus,
    createdAt: order.createdAt,
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      menuItem: mapMenuItem(item.menuItem),
      quantity: item.quantity,
      unitPriceRwf: item.unitPriceRwf,
    })),
  };
}

const orderInclude = {
  orderItems: { include: { menuItem: true } },
} satisfies Prisma.OrderInclude;

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

/**
 * Prisma/Postgres adapter: the durable production Store. Every method maps
 * Prisma rows onto the hand-written domain types so callers never see Prisma's
 * shapes. It satisfies the exact same contract suite as the in-memory adapter,
 * so the two cannot drift. ids come from Prisma (cuid) and are never assumed.
 */
export function createPrismaStore(client: PrismaClient = defaultPrisma): Store {
  async function getVendorBySlug(slug: string): Promise<Vendor | null> {
    const vendor = await client.vendor.findUnique({ where: { slug } });
    return vendor ? mapVendor(vendor) : null;
  }

  async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: { vendor: { slug: vendorSlug } },
      orderBy: { createdAt: "asc" },
    });
    return items.map(mapMenuItem);
  }

  async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: { vendor: { slug: vendorSlug }, isAvailable: true },
      orderBy: { createdAt: "asc" },
    });
    return items.map(mapMenuItem);
  }

  async function getCategories(vendorSlug: string): Promise<string[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    const rows = await client.menuItem.findMany({
      where: { vendorId: vendor.id },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return ["All", ...rows.map((r) => r.category)];
  }

  async function toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
    });
    if (!item) return null;

    const updated = await client.menuItem.update({
      where: { id: item.id },
      data: { isAvailable: !item.isAvailable },
    });
    return mapMenuItem(updated);
  }

  async function setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    await client.menuItem.updateMany({
      where: { vendorId: vendor.id },
      data: { isAvailable: true },
    });
    return getMenu(vendorSlug);
  }

  async function listOrders(vendorSlug: string): Promise<Order[]> {
    const orders = await client.order.findMany({
      where: { vendor: { slug: vendorSlug } },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async function listActiveOrders(vendorSlug: string): Promise<Order[]> {
    const orders = await client.order.findMany({
      where: {
        vendor: { slug: vendorSlug },
        status: { in: ACTIVE_STATUSES },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async function getOrder(orderId: string): Promise<Order | null> {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    return order ? mapOrder(order) : null;
  }

  async function createOrder(input: CreateOrderInput): Promise<Order> {
    const vendor = await client.vendor.findUnique({
      where: { slug: input.vendorSlug },
      select: { id: true },
    });
    if (!vendor) throw new Error("Vendor not found");

    const menuItems = await client.menuItem.findMany({
      where: { vendorId: vendor.id },
    });
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    const lines = input.items.map((line) => {
      const menuItem = menuById.get(line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Error(`Item unavailable: ${line.menuItemId}`);
      }
      return {
        menuItemId: menuItem.id,
        quantity: line.quantity,
        unitPriceRwf: menuItem.priceRwf,
      };
    });

    const totalAmount = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPriceRwf,
      0
    );

    const order = await client.order.create({
      data: {
        vendorId: vendor.id,
        customerPhone: input.customerPhone,
        deliverySector: input.deliverySector,
        landmark: input.landmark,
        totalAmount,
        status: "PENDING",
        orderItems: { create: lines },
      },
      include: orderInclude,
    });
    return mapOrder(order);
  }

  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null> {
    try {
      const order = await client.order.update({
        where: { id: orderId },
        data: { status },
        include: orderInclude,
      });
      return mapOrder(order);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function getDrivers(vendorSlug: string): Promise<Driver[]> {
    const drivers = await client.driver.findMany({
      where: { vendor: { slug: vendorSlug } },
      orderBy: { createdAt: "asc" },
    });
    return drivers.map(mapDriver);
  }

  async function getTodayGross(vendorSlug: string): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await client.order.aggregate({
      where: {
        vendorId: vendor.id,
        createdAt: { gte: today },
        status: { in: COUNTED_STATUSES },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0;
  }

  async function isKitchenOpen(vendorSlug: string): Promise<boolean> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { kitchenOpen: true, isActive: true },
    });
    if (!vendor) return false;
    return vendor.kitchenOpen && vendor.isActive;
  }

  async function setKitchenOpen(
    vendorSlug: string,
    open: boolean
  ): Promise<boolean> {
    try {
      const vendor = await client.vendor.update({
        where: { slug: vendorSlug },
        data: { kitchenOpen: open },
        select: { kitchenOpen: true },
      });
      return vendor.kitchenOpen;
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
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
  };
}
