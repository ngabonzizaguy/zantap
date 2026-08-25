function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Size rows recover to the smallest valid positive RWF amount instead of
 * surfacing a late whole-form error when a Vendor clears the field.
 */
export function parseSizePriceDraft(value: string): number {
  return Math.max(1, Number(digitsOnly(value)) || 0);
}

export function formatSizePriceDraft(value: string): string {
  return parseSizePriceDraft(value).toLocaleString("en-US");
}
