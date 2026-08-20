import type { MenuItem } from "@/lib/types";

export const STOREFRONT_MENU_PAGE_SIZE = 10;

type QueryValue = string | string[] | undefined;
export type StorefrontMenuSearchParams = Record<string, QueryValue>;

export interface StorefrontMenuQuery {
  category: string;
  search: string;
  page: number;
}

export interface StorefrontMenuPage {
  items: MenuItem[];
  total: number;
  page: number;
  pageCount: number;
}

function first(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStorefrontMenuQuery(
  searchParams: StorefrontMenuSearchParams,
  categories: readonly string[]
): StorefrontMenuQuery {
  const requestedCategory = first(searchParams.category);
  const category =
    requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : "All";
  const search = first(searchParams.search)?.trim() ?? "";
  const pageValue = first(searchParams.page);
  const parsedPage = pageValue && /^\d+$/.test(pageValue)
    ? Number.parseInt(pageValue, 10)
    : 1;

  return {
    category,
    search,
    page: parsedPage > 0 ? parsedPage : 1,
  };
}

export function buildStorefrontMenuHref(
  pathname: string,
  currentSearchParams: URLSearchParams,
  query: StorefrontMenuQuery
): string {
  const params = new URLSearchParams(currentSearchParams);
  if (query.category === "All") params.delete("category");
  else params.set("category", query.category);
  if (query.search.trim()) params.set("search", query.search.trim());
  else params.delete("search");
  if (query.page > 1) params.set("page", String(Math.floor(query.page)));
  else params.delete("page");
  const serialized = params.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}

export function paginateStorefrontMenu(
  menu: MenuItem[],
  query: StorefrontMenuQuery
): StorefrontMenuPage {
  const normalizedSearch = query.search.trim().toLocaleLowerCase();
  const available = menu.filter((item) => {
    if (!item.isAvailable) return false;
    if (query.category !== "All" && item.category !== query.category) {
      return false;
    }
    if (!normalizedSearch) return true;
    return [item.name, item.description, item.category].some((value) =>
      value?.toLocaleLowerCase().includes(normalizedSearch)
    );
  });
  const pageCount = Math.max(
    1,
    Math.ceil(available.length / STOREFRONT_MENU_PAGE_SIZE)
  );
  const requestedPage = Number.isFinite(query.page) ? Math.floor(query.page) : 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const start = (page - 1) * STOREFRONT_MENU_PAGE_SIZE;

  return {
    items: available.slice(start, start + STOREFRONT_MENU_PAGE_SIZE),
    total: available.length,
    page,
    pageCount,
  };
}
