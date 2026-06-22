import type {
  ConfirmPaymentResult,
  CreateOrderInput,
  CreatePaymentInput,
  CreatePaymentResult,
  Driver,
  MenuItem,
  Order,
  OrderStatus,
  Payment,
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
  getCategories(vendorSlug: string): Promise<string[]>;
  toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null>;
  setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]>;

  // Order reads + create + status
  listOrders(vendorSlug: string): Promise<Order[]>;
  listActiveOrders(vendorSlug: string): Promise<Order[]>;
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
