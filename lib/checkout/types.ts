export interface CheckoutLine {
  menuItemId: string;
  name: string;
  qty: number;
  lineTotal: number;
  notes?: string;
}

export type CartQuantities = Record<string, number>;
export type CartNotes = Record<string, string>;
