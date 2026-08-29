import type { MenuItem } from "@/lib/types";
import type {
  MenuIntakeDishDraft,
  MenuIntakeMatchSuggestion,
} from "@/lib/menu-intake/types";

export function normalizeMenuMatchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(value: string): Set<string> {
  return new Set(normalizeMenuMatchText(value).split(" ").filter(Boolean));
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  const common = [...left].filter((word) => right.has(word)).length;
  return common / Math.max(left.size, right.size);
}

export function suggestMenuIntakeMatches(
  dishes: MenuIntakeDishDraft[],
  menu: MenuItem[],
): MenuIntakeMatchSuggestion[] {
  return dishes.map((dish) => {
    const exact = menu.find(
      (item) =>
        normalizeMenuMatchText(item.name) === normalizeMenuMatchText(dish.name),
    );
    if (exact) {
      return {
        intakeDishClientId: dish.clientId,
        kind: "POSSIBLE_MATCH",
        existingMenuItemId: exact.id,
        existingName: exact.name,
        reason: "EXACT_NAME",
        defaultDecision: "SKIP",
      };
    }
    const close = menu.find(
      (item) =>
        normalizeMenuMatchText(item.category) ===
          normalizeMenuMatchText(dish.category) &&
        overlap(words(item.name), words(dish.name)) >= 0.5,
    );
    return close
      ? {
          intakeDishClientId: dish.clientId,
          kind: "POSSIBLE_MATCH",
          existingMenuItemId: close.id,
          existingName: close.name,
          reason: "CLOSE_NAME_CATEGORY",
          defaultDecision: "SKIP",
        }
      : {
          intakeDishClientId: dish.clientId,
          kind: "NEW",
          defaultDecision: "ADD_NEW",
        };
  });
}
