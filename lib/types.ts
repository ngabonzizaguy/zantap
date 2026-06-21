export type OrderStatus = "PENDING" | "PAID" | "DISPATCHED" | "COMPLETED";

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

export interface CreateOrderInput {
  vendorSlug: string;
  customerPhone: string;
  deliverySector: string;
  landmark: string;
  items: { menuItemId: string; quantity: number }[];
}

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
