export type OrderStatus = "PENDING" | "PAID" | "DISPATCHED" | "COMPLETED";

export type KitchenStage =
  | "NEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  phoneNumber: string;
  momoCode: string;
  isActive: boolean;
  tagline?: string;
  location?: string;
  deliveryTime?: string;
  rating?: number;
  createdAt: Date;
}

export interface MenuImage {
  id: string;
  menuItemId: string;
  url: string;
  blobPath?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  priceRwf: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  thumbFrom?: string;
  thumbTo?: string;
  archivedAt?: Date;
  images?: MenuImage[];
}

export interface AddMenuImageInput {
  url: string;
}

export interface CreateMenuItemInput {
  name: string;
  priceRwf: number;
  description?: string;
  category?: string;
}

export interface UpdateMenuItemInput {
  name?: string;
  priceRwf?: number;
  description?: string;
  category?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPriceRwf: number;
}

export interface Order {
  id: string;
  vendorId: string;
  customerPhone: string;
  deliverySector: string;
  landmark: string;
  totalAmount: number;
  status: OrderStatus;
  /** Set to NEW when payment succeeds; null while PENDING. */
  kitchenStage?: KitchenStage;
  /** Anchors KDS aging; set once at PAID transition. */
  paidAt?: Date;
  orderItems: OrderItem[];
  createdAt: Date;
}

export interface Driver {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  initials: string;
  hue: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  provider: "MTN_MOMO" | "AIRTEL_MONEY";
  transactionRef: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: Date;
}

export interface OrderHistoryFilters {
  datePreset?: "today" | "yesterday" | "last7" | "last30" | "custom";
  dateFrom?: Date;
  dateTo?: Date;
  status?: OrderStatus | "ALL";
  paymentStatus?: Payment["status"] | "ALL";
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface OrderHistoryItem {
  order: Order;
  paymentStatus: Payment["status"] | null;
}

export interface PaginatedOrders {
  orders: OrderHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateOrderInput {
  vendorSlug: string;
  customerPhone: string;
  deliverySector: string;
  landmark: string;
  items: { menuItemId: string; quantity: number }[];
}

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  transactionRef: string;
  provider?: Payment["provider"];
}

export type CreatePaymentResult =
  | { ok: true; payment: Payment }
  | { ok: false; code: "ORDER_NOT_FOUND" | "PAYMENT_TERMINALLY_FAILED" };

export type ConfirmPaymentResult =
  | { ok: true; payment: Payment }
  | {
      ok: false;
      code: "NOT_FOUND" | "INVALID_PIN" | "PAYMENT_TERMINALLY_FAILED";
      payment?: Payment;
    };

export interface StkPushRequest {
  orderId: string;
  phone: string;
  amount: number;
  vendorName: string;
}

export interface StkPushResponse {
  token: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  message: string;
}

export interface ConfirmPinRequest {
  token: string;
  pin: string;
}

export type CheckoutStage = "menu" | "cart" | "loading" | "ussd" | "success";

export const KIGALI_SECTORS = [
  "Kicukiro",
  "Remera",
  "Kimihurura",
  "Kiyovu",
  "Gikondo",
  "Nyamirambo",
  "Gisozi",
  "Kabeza",
] as const;

export type KigaliSector = (typeof KIGALI_SECTORS)[number];
