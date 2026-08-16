/**
 * Stable values persisted with Leads. Labels are translated independently by
 * their matching index in MARKETING_COPY.leadForm.fields.businessType.options.
 */
export const LEAD_BUSINESS_TYPE_VALUES = [
  "Restaurant",
  "Bar & grill",
  "Caterer",
  "Home-based food delivery",
  "Other food business",
] as const;

export function pairLeadBusinessTypeOptions(labels: readonly string[]) {
  return LEAD_BUSINESS_TYPE_VALUES.map((value, index) => ({
    value,
    label: labels[index] ?? value,
  }));
}
