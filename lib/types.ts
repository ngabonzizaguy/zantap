import type { ItemCustomization } from "@/lib/menu/customization";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

export type KitchenStage =
  | "NEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

/**
 * How a Vendor prefers to receive MoMo payouts. Preference-only today (the sim
 * behaviour is unchanged); real payout routing is deferred. See ADR-0022.
 */
export type PayoutMethod = "MERCHANT_CODE" | "PHONE";

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
  businessCategory?: string;
  payoutMethod: PayoutMethod;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  /** Ops-controlled KDS surface flags (ADR-0056). */
  featureWhatsappNotify: boolean;
  featureStockTracking: boolean;
  featureProfitInsights: boolean;
  createdAt: Date;
  // NOTE: ownerTokenHash is intentionally NOT on the domain Vendor — it is a
  // server-only secret hash and must never be serialized to the browser. Read it
  // via Store.getVendorOwnerTokenHash and compare with lib/vendor/owner-token.
}

export interface CreateVendorInput {
  name: string;
  slug: string;
  phoneNumber: string;
  momoCode: string;
  tagline?: string;
  location?: string;
  deliveryTime?: string;
  businessCategory?: string;
  payoutMethod?: PayoutMethod;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  ownerTokenHash?: string;
}

export interface UpdateVendorInput {
  name?: string;
  slug?: string;
  phoneNumber?: string;
  momoCode?: string;
  tagline?: string;
  location?: string;
  deliveryTime?: string;
  rating?: number;
  businessCategory?: string;
  payoutMethod?: PayoutMethod;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
}

/**
 * A server-side log entry emitted each time a Vendor recovers their owner token
 * (phone-based recovery, ADR-0022). Non-halting: recovery re-issues the token
 * immediately and records this event so the future ZanTap admin panel
 * (candidate #17) can run async verification. No admin UI consumes it yet.
 */
export interface VendorRecoveryEvent {
  id: string;
  vendorId: string;
  at: Date;
  context?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  /** Populated on cross-vendor list queries. */
  vendorSlug?: string;
  vendorName?: string;
}

export interface RecordRecoveryEventInput {
  vendorId: string;
  context?: string;
}

export interface OperatorAction {
  id: string;
  vendorId?: string;
  action: string;
  detail?: string;
  operatorId: string;
  at: Date;
}

export interface RecordOperatorActionInput {
  vendorId?: string;
  action: string;
  detail?: string;
  operatorId?: string;
}

export interface VendorListEntry {
  id: string;
  name: string;
  slug: string;
  phoneNumber: string;
  isActive: boolean;
  kitchenOpen: boolean;
  createdAt: Date;
  recoveryEventCount: number;
  lastRecoveryAt?: Date;
}

export interface VendorListFilters {
  search?: string;
  isActive?: boolean;
}

export interface RecoveryEventFilters {
  vendorSlug?: string;
  unreviewedOnly?: boolean;
  limit?: number;
}

export interface OperatorVendorDetail {
  vendor: Vendor;
  menuItemCount: number;
  activeOrderCount: number;
  recoveryEventCount: number;
  recentOrders: Order[];
  /** Present when stock tracking is meaningful for Ops visibility. */
  stockTrackedItemCount?: number;
  stockLowItemCount?: number;
  /** Present for profit Ops visibility. */
  todayGrossRwf?: number;
  weekdayAverageRwf?: number;
  weekProfitRwf?: number;
}

export interface OperatorUpdateVendorInput extends UpdateVendorInput {
  isActive?: boolean;
  kitchenOpen?: boolean;
  featureWhatsappNotify?: boolean;
  featureStockTracking?: boolean;
  featureProfitInsights?: boolean;
}

export interface OperatorOrderPatch {
  status?: OrderStatus;
  kitchenStage?: KitchenStage;
  reason?: string;
}

export interface OperatorReissueTokenResult {
  ownerToken: string;
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
  /** Remaining count when stock tracking is on for this item; undefined = unlimited. */
  stockCount?: number;
  lowStockThreshold?: number;
  /** Cost to make in RWF for margin math. */
  costPriceRwf?: number;
  archivedAt?: Date;
  images?: MenuImage[];
  /**
   * Optional, presentation-only customization catalog (included ingredients +
   * paid add-ons) for the storefront customize modal. In-memory passthrough
   * only today — no persistence. Absent on every item currently (renders a
   * generic fallback). Forward-compat seam for the future "real modifiers" epic.
   */
  customization?: ItemCustomization;
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
  stockCount?: number | null;
  lowStockThreshold?: number | null;
  costPriceRwf?: number | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPriceRwf: number;
  /** Special instructions from the customize modal (one per line item). */
  notes?: string;
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
  /** Driver assigned for delivery record-keeping (order may stay READY). */
  driverId?: string;
  assignedDriver?: Driver;
  /** Anchors KDS aging; set once at PAID transition. */
  paidAt?: Date;
  orderItems: OrderItem[];
  createdAt: Date;
  /** Last mutation time — used for KDS queue roll-off of completed tickets. */
  updatedAt?: Date;
}

export interface Driver {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  initials: string;
  hue: string;
}

export interface CreateDriverInput {
  name: string;
  phone: string;
}

export interface UpdateDriverInput {
  name?: string;
  phone?: string;
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
  items: { menuItemId: string; quantity: number; notes?: string }[];
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

export type ConfirmManualPaymentResult =
  | { ok: true; payment: Payment; order: Order }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "PHONE_MISMATCH"
        | "PAYMENT_TERMINALLY_FAILED"
        | "WINDOW_EXPIRED"
        | "ORDER_NOT_PENDING";
    };

export type AbandonManualPaymentResult =
  | { ok: true; payment: Payment; order: Order }
  | {
      ok: false;
      code: "NOT_FOUND" | "PHONE_MISMATCH" | "ALREADY_PAID";
    };

export type ResumableManualOrder = {
  order: Order;
  ussdDial: string;
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

export type CheckoutStage =
  | "menu"
  | "cart"
  | "loading"
  | "ussd"
  | "momo_dial"
  | "awaiting_confirmation"
  | "success";

export type MomoMode = "simulate" | "manual";

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
