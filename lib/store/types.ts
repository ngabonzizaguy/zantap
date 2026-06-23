import type {
  AddMenuImageInput,
  ConfirmPaymentResult,
  CreateMenuItemInput,
  CreateOrderInput,
  CreatePaymentInput,
  CreatePaymentResult,
  Driver,
  MenuImage,
  MenuItem,
  Order,
  OrderHistoryFilters,
  OrderStatus,
  PaginatedOrders,
  Pagination,
  Payment,
  UpdateMenuItemInput,
  Vendor,
} from "@/lib/types";

/**
 * The single seam through which all persistent reads and mutations pass.
 * Every adapter (in-memory, Prisma) implements this exact surface so callers
 * never depend on a concrete backend. The browser never sees this type; it is
 * reached only from Server Actions and React Server Components.
 */
export interface Store {
  // Vendor reads
  getVendorBySlug(slug: string): Promise<Vendor | null>;

  // Menu reads + availability mutation
  getMenu(vendorSlug: string): Promise<MenuItem[]>;
  getAvailableMenu(vendorSlug: string): Promise<MenuItem[]>;
  getArchivedMenu(vendorSlug: string): Promise<MenuItem[]>;
  getMenuItem(vendorSlug: string, itemId: string): Promise<MenuItem | null>;
  getCategories(vendorSlug: string): Promise<string[]>;
  createMenuItem(
    vendorSlug: string,
    input: CreateMenuItemInput
  ): Promise<MenuItem>;
  updateMenuItem(
    vendorSlug: string,
    itemId: string,
    input: UpdateMenuItemInput
  ): Promise<MenuItem | null>;
  archiveMenuItem(vendorSlug: string, itemId: string): Promise<MenuItem | null>;
  restoreMenuItem(vendorSlug: string, itemId: string): Promise<MenuItem | null>;
  renameCategory(
    vendorSlug: string,
    from: string,
    to: string
  ): Promise<number>;
  addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput
  ): Promise<MenuImage>;
  uploadMenuImageBlob(
    vendorSlug: string,
    itemId: string,
    file: Buffer,
    mime: string
  ): Promise<MenuImage>;
  reorderMenuImages(
    vendorSlug: string,
    itemId: string,
    imageIds: string[]
  ): Promise<MenuImage[]>;
  setPrimaryMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<MenuImage | null>;
  removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<boolean>;
  toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null>;
  setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]>;

  // Order reads + create + status
  listOrders(vendorSlug: string): Promise<Order[]>;
  listActiveOrders(vendorSlug: string): Promise<Order[]>;
  listOrdersFiltered(
    vendorSlug: string,
    filters: OrderHistoryFilters,
    pagination: Pagination
  ): Promise<PaginatedOrders>;
  getOrder(orderId: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null>;

  // Drivers
  getDrivers(vendorSlug: string): Promise<Driver[]>;

  // Today's gross
  getTodayGross(vendorSlug: string): Promise<number>;

  // Kitchen open/close
  isKitchenOpen(vendorSlug: string): Promise<boolean>;
  setKitchenOpen(vendorSlug: string, open: boolean): Promise<boolean>;

  // Payment (idempotent MoMo state machine — ADR-0001)
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentByRef(ref: string): Promise<Payment | null>;
  getPaymentForOrder(orderId: string): Promise<Payment | null>;
  confirmPayment(ref: string, pin: string): Promise<ConfirmPaymentResult>;
}

/**
 * Adapters used in tests expose a reset hook so each test starts from the same
 * seed. The in-memory adapter resets synchronously; the Prisma adapter reseeds
 * a disposable database, so reset may also be asynchronous.
 */
export interface ResettableStore extends Store {
  reset(): void | Promise<void>;
}
