import type {
  AddMenuImageInput,
  ConfirmPaymentResult,
  CreateMenuItemInput,
  CreateOrderInput,
  CreatePaymentInput,
  CreatePaymentResult,
  Driver,
  KitchenStage,
  MenuImage,
  MenuItem,
  Order,
  OrderHistoryFilters,
  OrderStatus,
  Pagination,
  Payment,
  UpdateMenuItemInput,
  Vendor,
} from "@/lib/types";
import type { ResettableStore } from "@/lib/store/types";
import {
  matchesOrderSearch,
  normalizePagination,
  paymentMatchesFilter,
  resolveDateRange,
} from "@/lib/orders/history-filters";
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
import {
  isForwardKitchenTransition,
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
} from "@/lib/kds/kitchen-stage";
import {
  seedDrivers,
  seedMenuItems,
  seedOrders,
  seedVendor,
} from "@/lib/store/seed-data";

function cloneOrder(order: Order): Order {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
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
  let kitchenOpen = true;
  let orderCounter = 0;
  let orderItemCounter = 0;
  let paymentCounter = 0;
  let menuItemCounter = 0;
  let menuImageCounter = 0;

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
    kitchenOpen = true;
    orderCounter = 0;
    orderItemCounter = 0;
    paymentCounter = 0;
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
    return addMenuImage(vendorSlug, itemId, {
      url: `https://blob.local/${pathname}`,
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

  function reset(): void {
    load();
  }

  return {
    getVendorBySlug,
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
    listOrdersFiltered,
    getOrder,
    createOrder,
    updateOrderStatus,
    updateKitchenStage,
    bulkUpdateKitchenStage,
    getDrivers,
    getTodayGross,
    isKitchenOpen,
    setKitchenOpen,
    createPayment,
    getPaymentByRef,
    getPaymentForOrder,
    confirmPayment,
    reset,
  };
}
