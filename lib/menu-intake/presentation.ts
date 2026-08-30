import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { canonicalizePhone, splitPhoneForDisplay } from "@/lib/format";
import type { MenuIntakeDishDraft } from "@/lib/menu-intake/types";

export const MENU_INTAKE_DISHES_PER_PAGE = 5;
const ZANTAP_MENU_INTAKE_PHONE = "0784928786";

export function buildMenuIntakeWhatsAppUrl(
  reference: string,
  businessName: string,
): string {
  return buildWhatsAppUrl(
    `Hello ZanTap. I sent my menu for ${businessName.trim() || "my business"}. Reference: ${reference}`,
    ZANTAP_MENU_INTAKE_PHONE,
  );
}

export function buildMenuIntakePhone(
  dialCode: string,
  nationalNumber: string,
): string {
  return canonicalizePhone(nationalNumber, dialCode);
}

export function formatMenuIntakePhone(phone: string): string {
  const { dialCode, local } = splitPhoneForDisplay(phone);
  const digits = local.replace(/\D/g, "").replace(/^0/, "");
  const groups =
    digits.length === 10
      ? [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
      : digits.match(/.{1,3}/g) || [];
  return [dialCode, ...groups].filter(Boolean).join(" ");
}

export type MenuIntakeDishIssue = {
  clientId: string;
  message: string;
};

export function getMenuIntakeDishIssues(
  dishes: readonly Pick<
    MenuIntakeDishDraft,
    "clientId" | "name" | "category" | "priceRwf" | "sizeOptions"
  >[],
): MenuIntakeDishIssue[] {
  return dishes.flatMap((dish, index) => {
    const missing: string[] = [];
    if (!dish.name.trim()) missing.push("name");
    if (!dish.category.trim()) missing.push("category");
    const hasSizePrice = Boolean(
      dish.sizeOptions?.some(
        (option) => option.isAvailable !== false && option.priceRwf > 0,
      ),
    );
    if (!(dish.priceRwf > 0) && !hasSizePrice) missing.push("price");
    if (!missing.length) return [];

    const label = dish.name.trim() || `Dish ${index + 1}`;
    const details =
      missing.length === 1
        ? missing[0]
        : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;
    return [{ clientId: dish.clientId, message: `${label} needs a ${details}.` }];
  });
}

export function paginateMenuIntakeDishes<T>(
  dishes: readonly T[],
  requestedPage: number,
): {
  page: number;
  pageCount: number;
  startIndex: number;
  items: T[];
} {
  const pageCount = Math.max(
    1,
    Math.ceil(dishes.length / MENU_INTAKE_DISHES_PER_PAGE),
  );
  const page = Math.min(Math.max(0, requestedPage), pageCount - 1);
  const startIndex = page * MENU_INTAKE_DISHES_PER_PAGE;

  return {
    page,
    pageCount,
    startIndex,
    items: dishes.slice(
      startIndex,
      startIndex + MENU_INTAKE_DISHES_PER_PAGE,
    ),
  };
}

export function appendSelectedFiles<T>(
  current: readonly T[],
  incoming: readonly T[],
  limit: number,
): T[] {
  return [...current, ...incoming].slice(0, limit);
}

export function removeSelectedFile<T>(files: readonly T[], index: number): T[] {
  return files.filter((_, fileIndex) => fileIndex !== index);
}
