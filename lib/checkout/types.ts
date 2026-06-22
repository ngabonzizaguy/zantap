export interface CheckoutLine {
  menuItemId: string;
  name: string;
  qty: number;
  lineTotal: number;
}

export type CartQuantities = Record<string, number>;
