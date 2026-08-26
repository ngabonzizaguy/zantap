import type {
  MenuItemAddOnGroup,
  OrderItemAddOnSnapshot,
} from "@/lib/types";

export const MAX_ADD_ON_GROUPS = 6;
export const MAX_ADD_ON_CHOICES = 12;
export const ADD_ON_LABEL_MAX = 60;
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;

export function normalizeMenuItemAddOnGroups(
  groups: readonly MenuItemAddOnGroup[]
): MenuItemAddOnGroup[] {
  return groups.map((group) => ({
    id: group.id,
    name: group.name.trim(),
    required: group.required,
    selection: group.selection,
    ...(group.selection === "MULTIPLE" && group.maxSelections
      ? { maxSelections: group.maxSelections }
      : {}),
    choices: group.choices.map((choice) => ({
      id: choice.id,
      label: choice.label.trim(),
      priceRwf: choice.priceRwf,
      isAvailable: choice.isAvailable,
    })),
  }));
}

export function parseMenuItemAddOnGroups(value: unknown): MenuItemAddOnGroup[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const groups = value as MenuItemAddOnGroup[];
  return validateMenuItemAddOnGroups(groups) ? undefined : normalizeMenuItemAddOnGroups(groups);
}

export function validateMenuItemAddOnGroups(
  groups: readonly MenuItemAddOnGroup[] | null | undefined
): string | null {
  if (groups == null || groups.length === 0) return null;
  if (groups.length > MAX_ADD_ON_GROUPS) return `Add-ons allow up to ${MAX_ADD_ON_GROUPS} groups`;
  const groupIds = new Set<string>();
  const allChoiceIds = new Set<string>();
  for (const group of groups) {
    if (!ID_PATTERN.test(group.id) || groupIds.has(group.id)) return "Each add-on group needs a unique id";
    groupIds.add(group.id);
    if (!group.name.trim() || group.name.trim().length > ADD_ON_LABEL_MAX) return `Group names must be 1–${ADD_ON_LABEL_MAX} characters`;
    if (group.selection !== "SINGLE" && group.selection !== "MULTIPLE") return "Choose single or multiple selection for every group";
    if (group.choices.length < 1 || group.choices.length > MAX_ADD_ON_CHOICES) return `Each add-on group needs 1–${MAX_ADD_ON_CHOICES} choices`;
    if (group.selection === "MULTIPLE" && (!Number.isInteger(group.maxSelections) || group.maxSelections! < 1 || group.maxSelections! > group.choices.length)) return "Multiple-choice limits must fit the number of choices";
    const choiceIds = new Set<string>();
    for (const choice of group.choices) {
      if (!ID_PATTERN.test(choice.id) || choiceIds.has(choice.id) || allChoiceIds.has(choice.id)) return "Each add-on choice needs a unique id within the item";
      choiceIds.add(choice.id);
      allChoiceIds.add(choice.id);
      if (!choice.label.trim() || choice.label.trim().length > ADD_ON_LABEL_MAX) return `Choice labels must be 1–${ADD_ON_LABEL_MAX} characters`;
      if (!Number.isInteger(choice.priceRwf) || choice.priceRwf < 0) return "Add-on prices must be non-negative whole RWF amounts";
    }
    if (group.required && !group.choices.some((choice) => choice.isAvailable)) return `${group.name.trim()} needs an available choice`;
  }
  return null;
}

export function resolveAddOnSelection(
  groups: readonly MenuItemAddOnGroup[] | undefined,
  choiceIds: readonly string[] = []
): { surchargeRwf: number; groups: OrderItemAddOnSnapshot[] } {
  const duplicate = choiceIds.find((id, index) => choiceIds.indexOf(id) !== index);
  if (duplicate) throw new Error("An add-on cannot be selected more than once");
  const remaining = new Set(choiceIds);
  const snapshots: OrderItemAddOnSnapshot[] = [];
  let surchargeRwf = 0;
  for (const group of groups ?? []) {
    const selected = group.choices.filter((choice) => remaining.delete(choice.id));
    if (group.required && selected.length === 0) throw new Error(`Choose one option from ${group.name}`);
    if (group.selection === "SINGLE" && selected.length > 1) throw new Error(`Choose only one option from ${group.name}`);
    if (group.selection === "MULTIPLE" && selected.length > (group.maxSelections ?? group.choices.length)) throw new Error(`Choose no more than ${group.maxSelections} options from ${group.name}`);
    for (const choice of selected) if (!choice.isAvailable) throw new Error(`${choice.label} is unavailable`);
    if (selected.length) {
      const choices = selected.map((choice) => ({ choiceId: choice.id, label: choice.label, priceRwf: choice.priceRwf }));
      snapshots.push({ groupId: group.id, groupName: group.name, choices });
      surchargeRwf += choices.reduce((sum, choice) => sum + choice.priceRwf, 0);
    }
  }
  if (remaining.size) throw new Error("An add-on choice no longer exists");
  return { surchargeRwf, groups: snapshots };
}

export function addOnSelectionSignature(choiceIds: readonly string[]): string {
  return [...choiceIds].sort().join(",");
}

export function buildAddOnCartLineKey(baseLineKey: string, choiceIds: readonly string[]): string {
  const signature = addOnSelectionSignature(choiceIds);
  return signature ? `${baseLineKey}##${signature}` : baseLineKey;
}

export function parseAddOnCartLineKey(lineKey: string): { baseLineKey: string; choiceIds: string[] } {
  const index = lineKey.indexOf("##");
  if (index < 0) return { baseLineKey: lineKey, choiceIds: [] };
  return {
    baseLineKey: lineKey.slice(0, index),
    choiceIds: lineKey.slice(index + 2).split(",").filter(Boolean),
  };
}

export function formatOrderItemAddOns(groups: readonly OrderItemAddOnSnapshot[] | undefined): string {
  return (groups ?? []).flatMap((group) => group.choices.map((choice) => choice.label)).join(", ");
}
