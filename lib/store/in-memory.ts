import type {
  AbandonManualPaymentResult,
  AddMenuImageInput,
  ConfirmManualPaymentResult,
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
  RecordRecoveryEventInput,
  ResumableManualOrder,
  UpdateMenuItemInput,
  UpdateVendorInput,
  Vendor,
  VendorRecoveryEvent,
} from "@/lib/types";
import type { ResettableStore } from "@/lib/store/types";
import {
  matchesOrderSearch,
  normalizePagination,
  paymentMatchesFilter,
  resolveDateRange,
} from "@/lib/orders/history-filters";
import { putMenuImageBlob } from "@/lib/menu/blob-storage";
import { thumbGradientForId } from "@/lib/menu/gradients";
import {
  assertCanAddMenuImage,
  buildMenuBlobPathname,
  MenuImageError,
  nextMenuImageSortOrder,
  pickNextPrimaryImage,
  sortMenuImages,
  validateMenuImageFile,
} from "@/lib/menu/media";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
} from "@/lib/menu/validation";
import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";
import { isWithinPaymentWindow } from "@/lib/momo/payment-window";
import {
  buildMomoUssdDial,
  orderPhoneMatches,
} from "@/lib/momo/ussd-dial";
import {
  isForwardKitchenTransition,
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
} from "@/lib/kds/kitchen-stage";
import {
  DEMO_OWNER_TOKEN_HASH,
  seedDrivers,
  seedMenuItems,
  seedOrders,
  seedVendor,
} from "@/lib/store/seed-data";
import { normalizeVendorSlug } from "@/lib/vendor/slug";
import { buildKdsSnapshotRevision } from "@/lib/kds/revision";
import { filterKdsQueueOrders } from "@/lib/kds/visible-orders";

const COUNTED_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];

/**
 * Internal row shape: the domain Vendor plus the server-only owner-token hash.
 * The hash is stripped in cloneVendor so it never crosses the Store seam.
 */
type StoredVendor = Vendor & { ownerTokenHash?: string };

function cloneOrder(order: Order): Order {
  const createdAt = new Date(order.createdAt);
  return {
    ...order,
    createdAt,
    updatedAt: order.updatedAt
      ? new Date(order.updatedAt)
      : new Date(order.paidAt ?? createdAt),
    paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
    orderItems: order.orderItems.map((item) => ({
      ...item,
      menuItem: item.menuItem
        ? {
            ...item.menuItem,
            archivedAt: item.menuItem.archivedAt
              ? new Date(item.menuItem.archivedAt)
              : undefined,
            images: item.menuItem.images?.map((image) => ({
              ...image,
              createdAt: new Date(image.createdAt),
            })),
          }
        : undefined,
    })),
  };
}

function clonePayment(payment: Payment): Payment {
  return { ...payment, createdAt: new Date(payment.createdAt) };
}

/**
 * In-memory adapter: the demo dataset promoted to a real Store implementation.
 * State lives in this closure (one instance per process) so a single dev
 * process has one source of truth. Tests get their own instances and reset
 * between runs. ids are generated internally and must not be assumed by callers.
 */
export function createInMemoryStore(): ResettableStore {
  let menuItems: MenuItem[] = [];
  let menuImages: MenuImage[] = [];
  let orders: Order[] = [];
  let payments: Payment[] = [];
  let vendors: StoredVendor[] = [];
  let recoveryEvents: VendorRecoveryEvent[] = [];
  let kitchenOpen = true;
  let orderCounter = 0;
  let orderItemCounter = 0;
  let paymentCounter = 0;
  let menuItemCounter = 0;
  let menuImageCounter = 0;
  let vendorCounter = 0;
  let recoveryEventCounter = 0;

  function cloneVendor(vendor: StoredVendor): Vendor {
    // Strip the server-only owner-token hash — it must never leave the Store.
    const { ownerTokenHash: _ownerTokenHash, ...rest } = vendor;
    return { ...rest, createdAt: new Date(vendor.createdAt) };
  }

  function cloneRecoveryEvent(event: VendorRecoveryEvent): VendorRecoveryEvent {
    return { ...event, at: new Date(event.at) };
  }

  function isActiveItem(item: MenuItem): boolean {
    return item.archivedAt == null;
  }

  function cloneMenuImage(image: MenuImage): MenuImage {
    return { ...image, createdAt: new Date(image.createdAt) };
  }

  function imagesForItem(itemId: string): MenuImage[] {
    return sortMenuImages(
      menuImages.filter((image) => image.menuItemId === itemId)
    ).map(cloneMenuImage);
  }

  function syncPrimaryToMenuItem(itemId: string): void {
    const index = menuItems.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const primary = menuImages.find(
      (image) => image.menuItemId === itemId && image.isPrimary
    );
    menuItems[index] = {
      ...menuItems[index],
      imageUrl: primary?.url,
    };
  }

  function hydrateMenuItem(item: MenuItem): MenuItem {
    const images = imagesForItem(item.id);
    return {
      ...cloneMenuItem(item),
      images: images.length > 0 ? images : undefined,
    };
  }

  function cloneMenuItem(item: MenuItem): MenuItem {
    return {
      ...item,
      archivedAt: item.archivedAt ? new Date(item.archivedAt) : undefined,
    };
  }

  function load(): void {
    menuItems = seedMenuItems.map((item) => ({ ...item }));
    menuImages = [];
    orders = seedOrders.map(cloneOrder);
    payments = [];
    vendors = [
      { ...seedVendor, ownerTokenHash: DEMO_OWNER_TOKEN_HASH },
    ];
    recoveryEvents = [];
    kitchenOpen = true;
    orderCounter = 0;
    orderItemCounter = 0;
    paymentCounter = 0;
    vendorCounter = 0;
    recoveryEventCounter = 0;
  }

  load();

  async function getVendorBySlug(slug: string): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(slug);
    const vendor = vendors.find((row) => row.slug === normalized);
    return vendor ? cloneVendor(vendor) : null;
  }

  async function isSlugAvailable(slug: string): Promise<boolean> {
    const normalized = normalizeVendorSlug(slug);
    if (!normalized) return false;
    return !vendors.some((row) => row.slug === normalized);
  }

  async function createVendor(input: CreateVendorInput): Promise<Vendor> {
    const normalizedSlug = normalizeVendorSlug(input.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid slug");
    }
    if (!(await isSlugAvailable(normalizedSlug))) {
      throw new Error("Slug already taken");
    }

    const vendor: StoredVendor = {
      id: `vendor_${++vendorCounter}_${Date.now()}`,
      name: input.name.trim(),
      slug: normalizedSlug,
      phoneNumber: input.phoneNumber,
      momoCode: input.momoCode,
      isActive: true,
      tagline: input.tagline,
      location: input.location,
      deliveryTime: input.deliveryTime,
      businessCategory: input.businessCategory,
      payoutMethod: input.payoutMethod ?? "MERCHANT_CODE",
      logoUrl: input.logoUrl,
      coverImageUrl: input.coverImageUrl,
      description: input.description,
      ownerTokenHash: input.ownerTokenHash,
      createdAt: new Date(),
    };
    vendors.push(vendor);
    return cloneVendor(vendor);
  }

  async function updateVendor(
    vendorSlug: string,
    input: UpdateVendorInput
  ): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const index = vendors.findIndex((row) => row.slug === normalized);
    if (index === -1) return null;

    const current = vendors[index];
    const updated: StoredVendor = {
      ...current,
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
    };
    vendors[index] = updated;
    return cloneVendor(updated);
  }

  async function getVendorOwnerTokenHash(
    vendorSlug: string
  ): Promise<string | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const vendor = vendors.find((row) => row.slug === normalized);
    return vendor?.ownerTokenHash ?? null;
  }

  async function setVendorOwnerToken(
    vendorSlug: string,
    ownerTokenHash: string
  ): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const index = vendors.findIndex((row) => row.slug === normalized);
    if (index === -1) return null;

    vendors[index] = { ...vendors[index], ownerTokenHash };
    return cloneVendor(vendors[index]);
  }

  async function recordRecoveryEvent(
    input: RecordRecoveryEventInput
  ): Promise<VendorRecoveryEvent> {
    const event: VendorRecoveryEvent = {
      id: `rec_${++recoveryEventCounter}_${Date.now()}`,
      vendorId: input.vendorId,
      context: input.context,
      at: new Date(),
    };
    recoveryEvents.push(event);
    return cloneRecoveryEvent(event);
  }

  async function listRecoveryEvents(
    vendorId: string
  ): Promise<VendorRecoveryEvent[]> {
    return recoveryEvents
      .filter((event) => event.vendorId === vendorId)
      .map(cloneRecoveryEvent)
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }

  async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return menuItems
      .filter((item) => item.vendorId === vendor.id && isActiveItem(item))
      .map(hydrateMenuItem);
  }

  async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
    const menu = await getMenu(vendorSlug);
    return menu.filter((item) => item.isAvailable);
  }

  async function getArchivedMenu(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return menuItems
      .filter((item) => item.vendorId === vendor.id && !isActiveItem(item))
      .map(hydrateMenuItem);
  }

  async function getMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const item = menuItems.find(
      (row) => row.id === itemId && row.vendorId === vendor.id
    );
    return item ? hydrateMenuItem(item) : null;
  }

  async function getCategories(vendorSlug: string): Promise<string[]> {
    const menu = await getMenu(vendorSlug);
    const categories = [...new Set(menu.map((item) => item.category))].sort();
    return ["All", ...categories];
  }

  async function createMenuItem(
    vendorSlug: string,
    input: CreateMenuItemInput
  ): Promise<MenuItem> {
    const validationError = validateCreateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) throw new Error("Vendor not found");

    const id = `mi_${++menuItemCounter}_${Date.now()}`;
    const gradient = thumbGradientForId(id);
    const item: MenuItem = {
      id,
      vendorId: vendor.id,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      priceRwf: input.priceRwf,
      category: input.category?.trim() || "General",
      isAvailable: true,
      ...gradient,
    };
    menuItems.push(item);
    return cloneMenuItem(item);
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

    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id
    );
    if (index === -1) return null;

    const current = menuItems[index];
    menuItems[index] = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      priceRwf: input.priceRwf ?? current.priceRwf,
      description:
        input.description !== undefined
          ? input.description.trim() || undefined
          : current.description,
      category:
        input.category !== undefined
          ? input.category.trim() || "General"
          : current.category,
    };
    return cloneMenuItem(menuItems[index]);
  }

  async function archiveMenuItem(
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
      archivedAt: new Date(),
    };
    return cloneMenuItem(menuItems[index]);
  }

  async function restoreMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id
    );
    if (index === -1) return null;

    const { archivedAt: _archivedAt, ...rest } = menuItems[index];
    menuItems[index] = rest;
    return cloneMenuItem(menuItems[index]);
  }

  async function renameCategory(
    vendorSlug: string,
    from: string,
    to: string
  ): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;

    const trimmedTo = to.trim() || "General";
    let updated = 0;
    menuItems = menuItems.map((item) => {
      if (
        item.vendorId === vendor.id &&
        isActiveItem(item) &&
        item.category === from
      ) {
        updated += 1;
        return { ...item, category: trimmedTo };
      }
      return item;
    });
    return updated;
  }

  async function addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput
  ): Promise<MenuImage> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    const existing = menuImages.filter((image) => image.menuItemId === itemId);
    assertCanAddMenuImage(existing.length);

    const isFirst = existing.length === 0;
    const image: MenuImage = {
      id: `mimg_${++menuImageCounter}_${Date.now()}`,
      menuItemId: itemId,
      url: input.url.trim(),
      sortOrder: nextMenuImageSortOrder(existing),
      isPrimary: isFirst,
      createdAt: new Date(),
    };
    menuImages.push(image);
    if (isFirst) syncPrimaryToMenuItem(itemId);
    return cloneMenuImage(image);
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

    const pathname = buildMenuBlobPathname(vendorSlug, itemId, mime);
    const uploaded = await putMenuImageBlob(pathname, file, mime);
    return addMenuImage(vendorSlug, itemId, {
      url: uploaded.url,
    }).then((image) => {
      const index = menuImages.findIndex((row) => row.id === image.id);
      if (index !== -1) {
        menuImages[index] = { ...menuImages[index], blobPath: pathname };
      }
      return { ...image, blobPath: pathname };
    });
  }

  async function reorderMenuImages(
    vendorSlug: string,
    itemId: string,
    imageIds: string[]
  ): Promise<MenuImage[]> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item?.images?.length) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    const itemImages = menuImages.filter((image) => image.menuItemId === itemId);
    if (
      imageIds.length !== itemImages.length ||
      !imageIds.every((id) => itemImages.some((image) => image.id === id))
    ) {
      throw new MenuImageError("Image set mismatch", "INVALID_SET");
    }

    imageIds.forEach((id, sortOrder) => {
      const index = menuImages.findIndex((image) => image.id === id);
      if (index !== -1) {
        menuImages[index] = { ...menuImages[index], sortOrder };
      }
    });

    return imagesForItem(itemId);
  }

  async function setPrimaryMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<MenuImage | null> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) return null;

    const target = menuImages.find(
      (image) => image.menuItemId === itemId && image.id === imageId
    );
    if (!target) return null;

    menuImages = menuImages.map((image) =>
      image.menuItemId === itemId
        ? { ...image, isPrimary: image.id === imageId }
        : image
    );
    syncPrimaryToMenuItem(itemId);
    return cloneMenuImage({ ...target, isPrimary: true });
  }

  async function removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<boolean> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) return false;

    const index = menuImages.findIndex(
      (image) => image.menuItemId === itemId && image.id === imageId
    );
    if (index === -1) return false;

    const removed = menuImages[index];
    menuImages.splice(index, 1);

    if (removed.isPrimary) {
      const next = pickNextPrimaryImage(
        menuImages.filter((image) => image.menuItemId === itemId)
      );
      menuImages = menuImages.map((image) =>
        image.menuItemId === itemId
          ? { ...image, isPrimary: next ? image.id === next.id : false }
          : image
      );
    }

    syncPrimaryToMenuItem(itemId);
    return true;
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

  async function listKdsOrders(vendorSlug: string): Promise<Order[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return filterKdsQueueOrders(
      orders.filter((o) => o.vendorId === vendor.id).map(cloneOrder)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function getKdsSnapshotRevision(vendorSlug: string): Promise<string> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return "missing";

    const queueOrders = filterKdsQueueOrders(
      orders.filter((o) => o.vendorId === vendor.id)
    );
    const activeMenu = menuItems.filter(
      (item) => item.vendorId === vendor.id && isActiveItem(item)
    );
    const todayGross = grossForDatePreset(vendor.id, "today");
    const yesterdayGross = grossForDatePreset(vendor.id, "yesterday");

    return buildKdsSnapshotRevision({
      orders: queueOrders.map((order) => ({
        id: order.id,
        status: order.status,
        kitchenStage: order.kitchenStage,
        totalAmount: order.totalAmount,
      })),
      menu: activeMenu.map((item) => ({
        id: item.id,
        isAvailable: item.isAvailable,
      })),
      todayGross,
      yesterdayGross,
      kitchenOpen: kitchenOpen && vendor.isActive,
    });
  }

  function paymentForOrder(orderId: string): Payment | null {
    return payments.find((p) => p.orderId === orderId) ?? null;
  }

  async function listOrdersFiltered(
    vendorSlug: string,
    filters: OrderHistoryFilters,
    pagination: Pagination
  ) {
    const vendor = await getVendorBySlug(vendorSlug);
    const { page, pageSize, skip } = normalizePagination(pagination);

    if (!vendor) {
      return { orders: [], total: 0, page, pageSize };
    }

    const range = resolveDateRange(filters);
    const statusFilter =
      filters.status && filters.status !== "ALL" ? filters.status : null;
    const paymentFilter =
      filters.paymentStatus && filters.paymentStatus !== "ALL"
        ? filters.paymentStatus
        : null;
    const search = filters.search?.trim() ?? "";

    let matched = orders.filter((o) => o.vendorId === vendor.id);

    if (range) {
      matched = matched.filter(
        (o) => o.createdAt >= range.from && o.createdAt <= range.to
      );
    }

    if (statusFilter) {
      matched = matched.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter) {
      matched = matched.filter((o) =>
        paymentMatchesFilter(paymentForOrder(o.id)?.status, paymentFilter)
      );
    }

    if (search) {
      matched = matched.filter((o) => matchesOrderSearch(o, search));
    }

    matched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = matched.length;
    const slice = matched.slice(skip, skip + pageSize);

    return {
      orders: slice.map((order) => ({
        order: cloneOrder(order),
        paymentStatus: paymentForOrder(order.id)?.status ?? null,
      })),
      total,
      page,
      pageSize,
    };
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
        menuItem: hydrateMenuItem(menuItem),
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
      updatedAt: new Date(),
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

    const current = orders[index];
    const kitchenStage = kitchenStageForOrderStatus(status);
    const paidAt =
      status === "PAID" && !current.paidAt ? new Date() : current.paidAt;

    orders[index] = {
      ...current,
      status,
      ...(kitchenStage != null ? { kitchenStage } : {}),
      paidAt,
      updatedAt: new Date(),
    };
    return cloneOrder(orders[index]);
  }

  async function updateKitchenStage(
    orderId: string,
    stage: KitchenStage
  ): Promise<Order | null> {
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const current = orders[index];
    if (current.kitchenStage == null) return null;
    if (
      current.kitchenStage !== stage &&
      !isForwardKitchenTransition(current.kitchenStage, stage)
    ) {
      return null;
    }

    const statusSideEffect = orderStatusForKitchenStage(stage);
    orders[index] = {
      ...current,
      kitchenStage: stage,
      ...(statusSideEffect ? { status: statusSideEffect } : {}),
      updatedAt: new Date(),
    };
    return cloneOrder(orders[index]);
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

  async function toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) =>
        item.id === itemId && item.vendorId === vendor.id && isActiveItem(item)
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
      item.vendorId === vendor.id && isActiveItem(item)
        ? { ...item, isAvailable: true }
        : item
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

  function grossForDatePreset(
    vendorId: string,
    preset: "today" | "yesterday"
  ): number {
    const range = resolveDateRange({ datePreset: preset });
    if (!range) return 0;

    return orders
      .filter(
        (o) =>
          o.vendorId === vendorId &&
          o.createdAt >= range.from &&
          o.createdAt <= range.to &&
          COUNTED_STATUSES.includes(o.status)
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  async function getTodayGross(vendorSlug: string): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;
    return grossForDatePreset(vendor.id, "today");
  }

  async function getYesterdayGross(vendorSlug: string): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;
    return grossForDatePreset(vendor.id, "yesterday");
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

  async function createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> {
    const order = orders.find((o) => o.id === input.orderId);
    if (!order) {
      return { ok: false, code: "ORDER_NOT_FOUND" };
    }

    const existing = payments.find((p) => p.orderId === input.orderId);
    if (existing) {
      if (existing.status === "PENDING" || existing.status === "SUCCESS") {
        return { ok: true, payment: clonePayment(existing) };
      }
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }

    const payment: Payment = {
      id: `pay_${++paymentCounter}_${Date.now()}`,
      orderId: input.orderId,
      amount: input.amount,
      provider: input.provider ?? "MTN_MOMO",
      transactionRef: input.transactionRef,
      status: "PENDING",
      createdAt: new Date(),
    };

    payments = [...payments, payment];
    return { ok: true, payment: clonePayment(payment) };
  }

  async function getPaymentByRef(ref: string): Promise<Payment | null> {
    const payment = payments.find((p) => p.transactionRef === ref);
    return payment ? clonePayment(payment) : null;
  }

  async function getPaymentForOrder(orderId: string): Promise<Payment | null> {
    const payment = paymentForOrder(orderId);
    return payment ? clonePayment(payment) : null;
  }

  async function confirmPayment(
    ref: string,
    pin: string
  ): Promise<ConfirmPaymentResult> {
    const index = payments.findIndex((p) => p.transactionRef === ref);
    if (index === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[index];

    if (payment.status === "SUCCESS") {
      return { ok: true, payment: clonePayment(payment) };
    }

    if (payment.status === "FAILED") {
      return {
        ok: false,
        code: "PAYMENT_TERMINALLY_FAILED",
        payment: clonePayment(payment),
      };
    }

    if (pin !== MOMO_SIM_VALID_PIN) {
      return {
        ok: false,
        code: "INVALID_PIN",
        payment: clonePayment(payment),
      };
    }

    payments[index] = { ...payment, status: "SUCCESS" };
    await updateOrderStatus(payment.orderId, "PAID");

    return { ok: true, payment: clonePayment(payments[index]) };
  }

  async function confirmManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<ConfirmManualPaymentResult> {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const order = orders[orderIndex];
    if (!orderPhoneMatches(order.customerPhone, customerPhone)) {
      return { ok: false, code: "PHONE_MISMATCH" };
    }

    const paymentIndex = payments.findIndex((p) => p.orderId === orderId);
    if (paymentIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[paymentIndex];

    if (payment.status === "SUCCESS" && order.status === "PAID") {
      return {
        ok: true,
        payment: clonePayment(payment),
        order: cloneOrder(order),
      };
    }

    if (order.status === "CANCELLED" || payment.status === "FAILED") {
      return { ok: false, code: "WINDOW_EXPIRED" };
    }

    if (order.status !== "PENDING") {
      return { ok: false, code: "ORDER_NOT_PENDING" };
    }

    if (!isWithinPaymentWindow(order.createdAt)) {
      return { ok: false, code: "WINDOW_EXPIRED" };
    }

    if (payment.status !== "PENDING") {
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }

    payments[paymentIndex] = { ...payment, status: "SUCCESS" };
    await updateOrderStatus(orderId, "PAID");
    const updatedOrder = orders.find((o) => o.id === orderId);

    return {
      ok: true,
      payment: clonePayment(payments[paymentIndex]),
      order: cloneOrder(updatedOrder ?? order),
    };
  }

  async function abandonManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<AbandonManualPaymentResult> {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const order = orders[orderIndex];
    if (!orderPhoneMatches(order.customerPhone, customerPhone)) {
      return { ok: false, code: "PHONE_MISMATCH" };
    }

    if (order.status === "PAID") {
      return { ok: false, code: "ALREADY_PAID" };
    }

    const paymentIndex = payments.findIndex((p) => p.orderId === orderId);
    if (paymentIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[paymentIndex];

    if (order.status === "CANCELLED" && payment.status === "FAILED") {
      return {
        ok: true,
        payment: clonePayment(payment),
        order: cloneOrder(order),
      };
    }

    payments[paymentIndex] = { ...payment, status: "FAILED" };
    await updateOrderStatus(orderId, "CANCELLED");
    const updatedOrder = orders.find((o) => o.id === orderId);

    return {
      ok: true,
      payment: clonePayment(payments[paymentIndex]),
      order: cloneOrder(updatedOrder ?? order),
    };
  }

  async function findResumableManualOrder(
    vendorSlug: string,
    customerPhone: string
  ): Promise<ResumableManualOrder | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const candidates = orders
      .filter(
        (order) =>
          order.vendorId === vendor.id &&
          order.status === "PENDING" &&
          isWithinPaymentWindow(order.createdAt)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const order of candidates) {
      if (!orderPhoneMatches(order.customerPhone, customerPhone)) continue;
      const payment = paymentForOrder(order.id);
      if (!payment || payment.status !== "PENDING") continue;

      const dial = buildMomoUssdDial(vendor, order.totalAmount);
      if (!dial.ok) continue;

      return { order: cloneOrder(order), ussdDial: dial.ussd };
    }

    return null;
  }

  function reset(): void {
    load();
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
    confirmManualPayment,
    abandonManualPayment,
    findResumableManualOrder,
    reset,
  };
}
