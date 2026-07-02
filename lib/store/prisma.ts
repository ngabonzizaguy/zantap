import "server-only";

import type {
  Driver as PrismaDriver,
  MenuImage as PrismaMenuImage,
  MenuItem as PrismaMenuItem,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  Prisma,
  PrismaClient,
  Vendor as PrismaVendor,
  VendorRecoveryEvent as PrismaVendorRecoveryEvent,
} from "@prisma/client";

import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";
import {
  isForwardKitchenTransition,
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
} from "@/lib/kds/kitchen-stage";
import { deleteMenuImageBlob, putMenuImageBlob } from "@/lib/menu/blob-storage";
import {
  assertCanAddMenuImage,
  buildMenuBlobPathname,
  MenuImageError,
  nextMenuImageSortOrder,
  pickNextPrimaryImage,
  sortMenuImages,
  validateMenuImageFile,
} from "@/lib/menu/media";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { Store } from "@/lib/store/types";
import type {
  AddMenuImageInput,
  ConfirmPaymentResult,
  CreateMenuItemInput,
  CreateOrderInput,
  CreatePaymentInput,
  CreatePaymentResult,
  CreateVendorInput,
  Driver,
  KitchenStage,
  MenuImage,
  MenuItem,
  Order,
  OrderHistoryFilters,
  OrderStatus,
  Pagination,
  Payment,
  PayoutMethod,
  RecordRecoveryEventInput,
  UpdateMenuItemInput,
  UpdateVendorInput,
  Vendor,
  VendorRecoveryEvent,
} from "@/lib/types";
import { normalizeVendorSlug } from "@/lib/vendor/slug";
import { thumbGradientForId } from "@/lib/menu/gradients";
import {
  normalizePagination,
  resolveDateRange,
  startOfDayInTimezone,
} from "@/lib/orders/history-filters";
import { buildKdsSnapshotRevision } from "@/lib/kds/revision";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
} from "@/lib/menu/validation";

// Statuses that count toward a vendor's gross takings for the day.
const COUNTED_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];
const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED"];

type PrismaMenuItemWithImages = PrismaMenuItem & {
  images?: PrismaMenuImage[];
};

type PrismaOrderWithItems = PrismaOrder & {
  orderItems: (PrismaOrderItem & { menuItem: PrismaMenuItemWithImages })[];
};

const activeMenuWhere = { archivedAt: null } as const;

const menuImageInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.MenuItemInclude;

const orderInclude = {
  orderItems: { include: { menuItem: { include: menuImageInclude } } },
} satisfies Prisma.OrderInclude;

/** KDS queue reads — line items need menu names, not full image galleries. */
const kdsOrderInclude = {
  orderItems: {
    include: {
      menuItem: {
        select: {
          id: true,
          vendorId: true,
          name: true,
          description: true,
          priceRwf: true,
          imageUrl: true,
          category: true,
          isAvailable: true,
          thumbFrom: true,
          thumbTo: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

function kdsOrdersWhere(
  vendorId: string,
  ref: Date = new Date()
): Prisma.OrderWhereInput {
  const startOfToday = startOfDayInTimezone(ref);
  return {
    vendorId,
    OR: [
      { status: { in: ["PAID", "DISPATCHED"] } },
      { status: "COMPLETED", updatedAt: { gte: startOfToday } },
    ],
  };
}

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
    businessCategory: vendor.businessCategory ?? undefined,
    payoutMethod: vendor.payoutMethod as PayoutMethod,
    logoUrl: vendor.logoUrl ?? undefined,
    coverImageUrl: vendor.coverImageUrl ?? undefined,
    description: vendor.description ?? undefined,
    createdAt: vendor.createdAt,
    // ownerTokenHash deliberately omitted — server-only (ADR-0022).
  };
}

function mapRecoveryEvent(
  event: PrismaVendorRecoveryEvent
): VendorRecoveryEvent {
  return {
    id: event.id,
    vendorId: event.vendorId,
    context: event.context ?? undefined,
    at: event.at,
  };
}

function mapMenuImage(image: PrismaMenuImage): MenuImage {
  return {
    id: image.id,
    menuItemId: image.menuItemId,
    url: image.url,
    blobPath: image.blobPath ?? undefined,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    createdAt: image.createdAt,
  };
}

function mapMenuItem(item: PrismaMenuItemWithImages): MenuItem {
  const images = item.images
    ? sortMenuImages(item.images.map(mapMenuImage))
    : undefined;
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
    archivedAt: item.archivedAt ?? undefined,
    images: images && images.length > 0 ? images : undefined,
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

function mapPayment(payment: PrismaPayment): Payment {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    provider: payment.provider as Payment["provider"],
    transactionRef: payment.transactionRef,
    status: payment.status as Payment["status"],
    createdAt: payment.createdAt,
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
    kitchenStage: order.kitchenStage ?? undefined,
    paidAt: order.paidAt ?? undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
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

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
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
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(slug) },
    });
    return vendor ? mapVendor(vendor) : null;
  }

  async function isSlugAvailable(slug: string): Promise<boolean> {
    const normalized = normalizeVendorSlug(slug);
    if (!normalized) return false;
    const vendor = await client.vendor.findUnique({ where: { slug: normalized } });
    return vendor === null;
  }

  async function createVendor(input: CreateVendorInput): Promise<Vendor> {
    const normalizedSlug = normalizeVendorSlug(input.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid slug");
    }

    try {
      const vendor = await client.vendor.create({
        data: {
          name: input.name.trim(),
          slug: normalizedSlug,
          phoneNumber: input.phoneNumber,
          momoCode: input.momoCode,
          isActive: true,
          kitchenOpen: true,
          tagline: input.tagline ?? null,
          location: input.location ?? null,
          deliveryTime: input.deliveryTime ?? null,
          businessCategory: input.businessCategory ?? null,
          payoutMethod: input.payoutMethod ?? "MERCHANT_CODE",
          logoUrl: input.logoUrl ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          description: input.description ?? null,
          ownerTokenHash: input.ownerTokenHash ?? null,
        },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Slug already taken");
      }
      throw error;
    }
  }

  async function updateVendor(
    vendorSlug: string,
    input: UpdateVendorInput
  ): Promise<Vendor | null> {
    const slug = normalizeVendorSlug(vendorSlug);
    try {
      const vendor = await client.vendor.update({
        where: { slug },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.phoneNumber !== undefined
            ? { phoneNumber: input.phoneNumber }
            : {}),
          ...(input.momoCode !== undefined ? { momoCode: input.momoCode } : {}),
          ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
          ...(input.location !== undefined ? { location: input.location } : {}),
          ...(input.deliveryTime !== undefined
            ? { deliveryTime: input.deliveryTime }
            : {}),
          ...(input.rating !== undefined ? { rating: input.rating } : {}),
          ...(input.businessCategory !== undefined
            ? { businessCategory: input.businessCategory }
            : {}),
          ...(input.payoutMethod !== undefined
            ? { payoutMethod: input.payoutMethod }
            : {}),
          ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
          ...(input.coverImageUrl !== undefined
            ? { coverImageUrl: input.coverImageUrl }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
        },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function getVendorOwnerTokenHash(
    vendorSlug: string
  ): Promise<string | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { ownerTokenHash: true },
    });
    return vendor?.ownerTokenHash ?? null;
  }

  async function setVendorOwnerToken(
    vendorSlug: string,
    ownerTokenHash: string
  ): Promise<Vendor | null> {
    try {
      const vendor = await client.vendor.update({
        where: { slug: normalizeVendorSlug(vendorSlug) },
        data: { ownerTokenHash },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function recordRecoveryEvent(
    input: RecordRecoveryEventInput
  ): Promise<VendorRecoveryEvent> {
    const event = await client.vendorRecoveryEvent.create({
      data: {
        vendorId: input.vendorId,
        context: input.context ?? null,
      },
    });
    return mapRecoveryEvent(event);
  }

  async function listRecoveryEvents(
    vendorId: string
  ): Promise<VendorRecoveryEvent[]> {
    const events = await client.vendorRecoveryEvent.findMany({
      where: { vendorId },
      orderBy: { at: "desc" },
    });
    return events.map(mapRecoveryEvent);
  }

  async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: { vendor: { slug: vendorSlug }, ...activeMenuWhere },
      include: menuImageInclude,
      orderBy: { createdAt: "asc" },
    });
    return items.map(mapMenuItem);
  }

  async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: {
        vendor: { slug: vendorSlug },
        isAvailable: true,
        ...activeMenuWhere,
      },
      include: menuImageInclude,
      orderBy: { createdAt: "asc" },
    });
    return items.map(mapMenuItem);
  }

  async function getArchivedMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: { vendor: { slug: vendorSlug }, archivedAt: { not: null } },
      include: menuImageInclude,
      orderBy: { archivedAt: "desc" },
    });
    return items.map(mapMenuItem);
  }

  async function getMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    return item ? mapMenuItem(item) : null;
  }

  async function getCategories(vendorSlug: string): Promise<string[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    const rows = await client.menuItem.findMany({
      where: { vendorId: vendor.id, ...activeMenuWhere },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return ["All", ...rows.map((r) => r.category)];
  }

  async function createMenuItem(
    vendorSlug: string,
    input: CreateMenuItemInput
  ): Promise<MenuItem> {
    const validationError = validateCreateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) throw new Error("Vendor not found");

    const gradient = thumbGradientForId(`new_${Date.now()}`);
    const created = await client.menuItem.create({
      data: {
        vendorId: vendor.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        priceRwf: input.priceRwf,
        category: input.category?.trim() || "General",
        isAvailable: true,
        thumbFrom: gradient.thumbFrom,
        thumbTo: gradient.thumbTo,
      },
    });
    return mapMenuItem(created);
  }

  async function updateMenuItem(
    vendorSlug: string,
    itemId: string,
    input: UpdateMenuItemInput
  ): Promise<MenuItem | null> {
    const validationError = validateUpdateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const existing = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
    });
    if (!existing) return null;

    const data: Prisma.MenuItemUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.priceRwf !== undefined) data.priceRwf = input.priceRwf;
    if (input.description !== undefined) {
      data.description = input.description.trim() || null;
    }
    if (input.category !== undefined) {
      data.category = input.category.trim() || "General";
    }

    try {
      const updated = await client.menuItem.update({
        where: { id: existing.id },
        data,
      });
      return mapMenuItem(updated);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function archiveMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const existing = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug }, ...activeMenuWhere },
    });
    if (!existing) return null;

    try {
      const updated = await client.menuItem.update({
        where: { id: existing.id },
        data: { archivedAt: new Date() },
      });
      return mapMenuItem(updated);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function restoreMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const existing = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug }, archivedAt: { not: null } },
    });
    if (!existing) return null;

    try {
      const updated = await client.menuItem.update({
        where: { id: existing.id },
        data: { archivedAt: null },
      });
      return mapMenuItem(updated);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function renameCategory(
    vendorSlug: string,
    from: string,
    to: string
  ): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;

    const result = await client.menuItem.updateMany({
      where: {
        vendorId: vendor.id,
        category: from,
        ...activeMenuWhere,
      },
      data: { category: to.trim() || "General" },
    });
    return result.count;
  }

  async function addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput
  ): Promise<MenuImage> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    assertCanAddMenuImage(item.images.length);
    const isFirst = item.images.length === 0;

    const created = await client.$transaction(async (tx) => {
      const image = await tx.menuImage.create({
        data: {
          menuItemId: item.id,
          url: input.url.trim(),
          sortOrder: nextMenuImageSortOrder(item.images.map(mapMenuImage)),
          isPrimary: isFirst,
        },
      });
      if (isFirst) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: { imageUrl: image.url },
        });
      }
      return image;
    });

    return mapMenuImage(created);
  }

  async function uploadMenuImageBlob(
    vendorSlug: string,
    itemId: string,
    file: Buffer,
    mime: string
  ): Promise<MenuImage> {
    const validationError = validateMenuImageFile(file.byteLength, mime);
    if (validationError) {
      throw new Error(validationError);
    }

    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    assertCanAddMenuImage(item.images.length);
    const isFirst = item.images.length === 0;
    const pathname = buildMenuBlobPathname(vendorSlug, itemId, mime);
    const uploaded = await putMenuImageBlob(pathname, file, mime);

    const created = await client.$transaction(async (tx) => {
      const image = await tx.menuImage.create({
        data: {
          menuItemId: item.id,
          url: uploaded.url,
          blobPath: uploaded.pathname,
          sortOrder: nextMenuImageSortOrder(item.images.map(mapMenuImage)),
          isPrimary: isFirst,
        },
      });
      if (isFirst) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: { imageUrl: image.url },
        });
      }
      return image;
    });

    return mapMenuImage(created);
  }

  async function reorderMenuImages(
    vendorSlug: string,
    itemId: string,
    imageIds: string[]
  ): Promise<MenuImage[]> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    if (
      imageIds.length !== item.images.length ||
      !imageIds.every((id) => item.images.some((image) => image.id === id))
    ) {
      throw new MenuImageError("Image set mismatch", "INVALID_SET");
    }

    await client.$transaction(
      imageIds.map((id, sortOrder) =>
        client.menuImage.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );

    const refreshed = await client.menuImage.findMany({
      where: { menuItemId: item.id },
      orderBy: { sortOrder: "asc" },
    });
    return sortMenuImages(refreshed.map(mapMenuImage));
  }

  async function setPrimaryMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<MenuImage | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) return null;

    const target = item.images.find((image) => image.id === imageId);
    if (!target) return null;

    await client.$transaction(async (tx) => {
      await tx.menuImage.updateMany({
        where: { menuItemId: item.id },
        data: { isPrimary: false },
      });
      await tx.menuImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
      await tx.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: target.url },
      });
    });

    return mapMenuImage({ ...target, isPrimary: true });
  }

  async function removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<boolean> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) return false;

    const target = item.images.find((image) => image.id === imageId);
    if (!target) return false;

    const remaining = item.images.filter((image) => image.id !== imageId);
    const nextPrimary = target.isPrimary
      ? pickNextPrimaryImage(remaining.map(mapMenuImage))
      : remaining.find((image) => image.isPrimary);

    await client.$transaction(async (tx) => {
      await tx.menuImage.delete({ where: { id: imageId } });
      if (target.isPrimary && nextPrimary) {
        await tx.menuImage.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
      await tx.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: nextPrimary?.url ?? null },
      });
    });

    if (target.blobPath) {
      await deleteMenuImageBlob(target.blobPath);
    }

    return true;
  }

  async function toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug }, ...activeMenuWhere },
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
      where: { vendorId: vendor.id, ...activeMenuWhere },
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

  async function listKdsOrders(vendorSlug: string): Promise<Order[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    const orders = await client.order.findMany({
      where: kdsOrdersWhere(vendor.id),
      include: kdsOrderInclude,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async function getKdsSnapshotRevision(vendorSlug: string): Promise<string> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true, kitchenOpen: true, isActive: true },
    });
    if (!vendor) return "missing";

    const [orderRows, menuRows, todayGrossResult, yesterdayGrossResult] =
      await Promise.all([
      client.order.findMany({
        where: kdsOrdersWhere(vendor.id),
        select: {
          id: true,
          status: true,
          kitchenStage: true,
          totalAmount: true,
        },
        orderBy: { id: "asc" },
      }),
      client.menuItem.findMany({
        where: { vendorId: vendor.id, archivedAt: null },
        select: { id: true, isAvailable: true },
        orderBy: { id: "asc" },
      }),
      aggregateGrossForPreset(vendor.id, "today"),
      aggregateGrossForPreset(vendor.id, "yesterday"),
    ]);

    return buildKdsSnapshotRevision({
      orders: orderRows.map((row) => ({
        id: row.id,
        status: row.status as OrderStatus,
        kitchenStage: row.kitchenStage ?? undefined,
        totalAmount: row.totalAmount,
      })),
      menu: menuRows,
      todayGross: todayGrossResult,
      yesterdayGross: yesterdayGrossResult,
      kitchenOpen: vendor.kitchenOpen && vendor.isActive,
    });
  }

  async function listOrdersFiltered(
    vendorSlug: string,
    filters: OrderHistoryFilters,
    pagination: Pagination
  ) {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    const { page, pageSize, skip } = normalizePagination(pagination);

    if (!vendor) {
      return { orders: [], total: 0, page, pageSize };
    }

    const range = resolveDateRange(filters);
    const where: Prisma.OrderWhereInput = { vendorId: vendor.id };

    if (range) {
      where.createdAt = { gte: range.from, lte: range.to };
    }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
      where.payment = { status: filters.paymentStatus };
    }

    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { customerPhone: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      client.order.findMany({
        where,
        include: {
          ...orderInclude,
          payment: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      client.order.count({ where }),
    ]);

    return {
      orders: rows.map((row) => {
        const { payment, ...orderRow } = row;
        return {
          order: mapOrder(orderRow as PrismaOrderWithItems),
          paymentStatus: payment?.status ?? null,
        };
      }),
      total,
      page,
      pageSize,
    };
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
      where: { vendorId: vendor.id, ...activeMenuWhere },
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
      const current = await client.order.findUnique({
        where: { id: orderId },
        select: { paidAt: true },
      });
      if (!current) return null;

      const kitchenStage = kitchenStageForOrderStatus(status);
      const paidAt =
        status === "PAID" && !current.paidAt ? new Date() : undefined;

      const order = await client.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(kitchenStage != null ? { kitchenStage } : {}),
          ...(paidAt ? { paidAt } : {}),
        },
        include: orderInclude,
      });
      return mapOrder(order);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function updateKitchenStage(
    orderId: string,
    stage: KitchenStage
  ): Promise<Order | null> {
    const current = await client.order.findUnique({
      where: { id: orderId },
      select: { kitchenStage: true },
    });
    if (!current?.kitchenStage) return null;
    if (
      current.kitchenStage !== stage &&
      !isForwardKitchenTransition(
        current.kitchenStage as KitchenStage,
        stage
      )
    ) {
      return null;
    }

    const statusSideEffect = orderStatusForKitchenStage(stage);
    try {
      const order = await client.order.update({
        where: { id: orderId },
        data: {
          kitchenStage: stage,
          ...(statusSideEffect ? { status: statusSideEffect } : {}),
        },
        include: orderInclude,
      });
      return mapOrder(order);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function bulkUpdateKitchenStage(
    orderIds: string[],
    stage: KitchenStage
  ): Promise<Order[]> {
    const updated: Order[] = [];
    for (const orderId of orderIds) {
      const order = await updateKitchenStage(orderId, stage);
      if (order) updated.push(order);
    }
    return updated;
  }

  async function getDrivers(vendorSlug: string): Promise<Driver[]> {
    const drivers = await client.driver.findMany({
      where: { vendor: { slug: vendorSlug } },
      orderBy: { createdAt: "asc" },
    });
    return drivers.map(mapDriver);
  }

  async function aggregateGrossForPreset(
    vendorId: string,
    preset: "today" | "yesterday"
  ): Promise<number> {
    const range = resolveDateRange({ datePreset: preset });
    if (!range) return 0;

    const result = await client.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: range.from, lte: range.to },
        status: { in: COUNTED_STATUSES },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0;
  }

  async function getTodayGross(vendorSlug: string): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;
    return aggregateGrossForPreset(vendor.id, "today");
  }

  async function getYesterdayGross(vendorSlug: string): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;
    return aggregateGrossForPreset(vendor.id, "yesterday");
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

  async function createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> {
    const order = await client.order.findUnique({
      where: { id: input.orderId },
      select: { id: true },
    });
    if (!order) {
      return { ok: false, code: "ORDER_NOT_FOUND" };
    }

    const existing = await client.payment.findUnique({
      where: { orderId: input.orderId },
    });
    if (existing) {
      if (existing.status === "PENDING" || existing.status === "SUCCESS") {
        return { ok: true, payment: mapPayment(existing) };
      }
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }

    try {
      const created = await client.payment.create({
        data: {
          orderId: input.orderId,
          amount: input.amount,
          provider: input.provider ?? "MTN_MOMO",
          transactionRef: input.transactionRef,
          status: "PENDING",
        },
      });
      return { ok: true, payment: mapPayment(created) };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      const raced = await client.payment.findUnique({
        where: { orderId: input.orderId },
      });
      if (!raced) throw error;

      if (raced.status === "PENDING" || raced.status === "SUCCESS") {
        return { ok: true, payment: mapPayment(raced) };
      }
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }
  }

  async function getPaymentByRef(ref: string): Promise<Payment | null> {
    const payment = await client.payment.findUnique({
      where: { transactionRef: ref },
    });
    return payment ? mapPayment(payment) : null;
  }

  async function getPaymentForOrder(orderId: string): Promise<Payment | null> {
    const payment = await client.payment.findUnique({
      where: { orderId },
    });
    return payment ? mapPayment(payment) : null;
  }

  async function confirmPayment(
    ref: string,
    pin: string
  ): Promise<ConfirmPaymentResult> {
    const payment = await client.payment.findUnique({
      where: { transactionRef: ref },
    });
    if (!payment) {
      return { ok: false, code: "NOT_FOUND" };
    }

    if (payment.status === "SUCCESS") {
      return { ok: true, payment: mapPayment(payment) };
    }

    if (payment.status === "FAILED") {
      return {
        ok: false,
        code: "PAYMENT_TERMINALLY_FAILED",
        payment: mapPayment(payment),
      };
    }

    if (pin !== MOMO_SIM_VALID_PIN) {
      return {
        ok: false,
        code: "INVALID_PIN",
        payment: mapPayment(payment),
      };
    }

    const updated = await client.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { transactionRef: ref },
      });
      if (!current) {
        throw new Error("Payment not found during confirm transaction");
      }
      if (current.status === "SUCCESS") {
        return current;
      }

      const [paymentRow] = await Promise.all([
        tx.payment.update({
          where: { id: current.id },
          data: { status: "SUCCESS" },
        }),
        tx.order.update({
          where: { id: current.orderId },
          data: {
            status: "PAID",
            kitchenStage: "NEW",
            paidAt: new Date(),
          },
        }),
      ]);
      return paymentRow;
    });

    return { ok: true, payment: mapPayment(updated) };
  }

  return {
    getVendorBySlug,
    isSlugAvailable,
    createVendor,
    updateVendor,
    getVendorOwnerTokenHash,
    setVendorOwnerToken,
    recordRecoveryEvent,
    listRecoveryEvents,
    getMenu,
    getAvailableMenu,
    getArchivedMenu,
    getMenuItem,
    getCategories,
    createMenuItem,
    updateMenuItem,
    archiveMenuItem,
    restoreMenuItem,
    renameCategory,
    addMenuImage,
    uploadMenuImageBlob,
    reorderMenuImages,
    setPrimaryMenuImage,
    removeMenuImage,
    toggleItemAvailability,
    setAllItemsAvailable,
    listOrders,
    listActiveOrders,
    listKdsOrders,
    getKdsSnapshotRevision,
    listOrdersFiltered,
    getOrder,
    createOrder,
    updateOrderStatus,
    updateKitchenStage,
    bulkUpdateKitchenStage,
    getDrivers,
    getTodayGross,
    getYesterdayGross,
    isKitchenOpen,
    setKitchenOpen,
    createPayment,
    getPaymentByRef,
    getPaymentForOrder,
    confirmPayment,
  };
}
