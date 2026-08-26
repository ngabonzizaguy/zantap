export interface CheckoutLine {
  /** Stable cart identity; distinguishes sizes of the same menu item. */
  lineKey: string;
  menuItemId: string;
  name: string;
  sizeOptionId?: string;
  sizeLabel?: string;
  addOnChoiceIds?: string[];
  addOnLabels?: string[];
  qty: number;
  lineTotal: number;
  notes?: string;
}

export type CartQuantities = Record<string, number>;
export type CartNotes = Record<string, string>;
