import { buildWhatsAppUrl } from "@/lib/whatsapp";

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
