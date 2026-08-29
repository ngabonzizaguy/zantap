export const MENU_INTAKE_DISHES_PER_PAGE = 5;

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
