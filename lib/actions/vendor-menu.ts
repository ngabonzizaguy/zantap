"use server";

import { getStore } from "@/lib/store";
import type {
  CreateMenuItemInput,
  MenuImage,
  MenuItem,
  UpdateMenuItemInput,
} from "@/lib/types";
import { validateMenuImageFile } from "@/lib/menu/media";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
} from "@/lib/menu/validation";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";
import {
  buildMenuImageUpdateEntry,
  buildMenuUpdateEntry,
  buildNewDishUpdateEntry,
  buildRestoredDishUpdateEntry,
} from "@/lib/vendor-updates/publication";
import type { VendorSaveOptions } from "@/lib/vendor-updates/types";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

export async function loadArchivedMenu(
  vendorSlug: string
): Promise<MenuItem[]> {
  return getStore().getArchivedMenu(vendorSlug);
}

export async function loadMenuCategories(vendorSlug: string): Promise<string[]> {
  const categories = await getStore().getCategories(vendorSlug);
  return categories.filter((category) => category !== "All");
}

export async function createMenuItem(
  ownerToken: string,
  vendorSlug: string,
  input: CreateMenuItemInput,
  options: VendorSaveOptions = {}
): Promise<MenuItem> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const validationError = validateCreateMenuItemInput(input);
  if (validationError) {
    throw new Error(validationError);
  }
  const store = getStore();
  const created = await store.createMenuItem(vendorSlug, {
    name: input.name.trim(),
    priceRwf: input.priceRwf,
    sizeOptions: input.sizeOptions,
    description: input.description?.trim() || undefined,
    category: input.category?.trim() || "General",
  });
  await store.recordVendorUpdate(vendorSlug, {
    announce: options.announce,
    entry: buildNewDishUpdateEntry(created),
  });
  return created;
}

export async function updateMenuItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  input: UpdateMenuItemInput,
  options: VendorSaveOptions = {}
): Promise<MenuItem | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const validationError = validateUpdateMenuItemInput(input);
  if (validationError) {
    throw new Error(validationError);
  }
  const store = getStore();
  const before = await store.getMenuItem(vendorSlug, itemId);
  const updated = await store.updateMenuItem(vendorSlug, itemId, {
    name: input.name?.trim(),
    priceRwf: input.priceRwf,
    sizeOptions: input.sizeOptions,
    description:
      input.description !== undefined
        ? input.description.trim() || undefined
        : undefined,
    category:
      input.category !== undefined
        ? input.category.trim() || "General"
        : undefined,
    stockCount: input.stockCount,
    lowStockThreshold: input.lowStockThreshold,
    costPriceRwf: input.costPriceRwf,
  });
  if (before && updated) {
    const entry = buildMenuUpdateEntry(before, updated);
    if (entry) {
      await store.recordVendorUpdate(vendorSlug, {
        announce: options.announce,
        entry,
      });
    }
  }
  return updated;
}

export async function archiveMenuItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string
): Promise<MenuItem | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().archiveMenuItem(vendorSlug, itemId);
}

export async function restoreMenuItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  options: VendorSaveOptions = {}
): Promise<MenuItem | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const store = getStore();
  const restored = await store.restoreMenuItem(vendorSlug, itemId);
  if (restored) {
    await store.recordVendorUpdate(vendorSlug, {
      announce: options.announce,
      entry: buildRestoredDishUpdateEntry(restored),
    });
  }
  return restored;
}

export async function renameCategory(
  ownerToken: string,
  vendorSlug: string,
  from: string,
  to: string
): Promise<number> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().renameCategory(vendorSlug, from, to);
}

export async function uploadMenuImage(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  formData: FormData,
  options: VendorSaveOptions = {}
): Promise<MenuImage> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No image file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validationError = validateMenuImageFile(buffer.byteLength, file.type);
  if (validationError) {
    throw new Error(validationError);
  }

  const store = getStore();
  const before = await store.getMenuItem(vendorSlug, itemId);
  const image = await store.uploadMenuImageBlob(
    vendorSlug,
    itemId,
    buffer,
    file.type
  );
  const after = await store.getMenuItem(vendorSlug, itemId);
  if (before && after) {
    const entry = buildMenuImageUpdateEntry(before, after);
    if (entry) {
      await store.recordVendorUpdate(vendorSlug, {
        announce: options.announce,
        entry,
      });
    }
  }
  return image;
}

export async function reorderMenuImages(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  imageIds: string[],
  options: VendorSaveOptions = {}
): Promise<MenuImage[]> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const store = getStore();
  const before = await store.getMenuItem(vendorSlug, itemId);
  const images = await store.reorderMenuImages(vendorSlug, itemId, imageIds);
  const after = await store.getMenuItem(vendorSlug, itemId);
  if (before && after) {
    const entry = buildMenuImageUpdateEntry(before, after);
    if (entry) await store.recordVendorUpdate(vendorSlug, { announce: options.announce, entry });
  }
  return images;
}

export async function setPrimaryMenuImage(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  imageId: string,
  options: VendorSaveOptions = {}
): Promise<MenuImage | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const store = getStore();
  const before = await store.getMenuItem(vendorSlug, itemId);
  const image = await store.setPrimaryMenuImage(vendorSlug, itemId, imageId);
  const after = await store.getMenuItem(vendorSlug, itemId);
  if (before && after) {
    const entry = buildMenuImageUpdateEntry(before, after);
    if (entry) await store.recordVendorUpdate(vendorSlug, { announce: options.announce, entry });
  }
  return image;
}

export async function removeMenuImage(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  imageId: string,
  options: VendorSaveOptions = {}
): Promise<boolean> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const store = getStore();
  const before = await store.getMenuItem(vendorSlug, itemId);
  const removed = await store.removeMenuImage(vendorSlug, itemId, imageId);
  const after = await store.getMenuItem(vendorSlug, itemId);
  if (removed && before && after) {
    const entry = buildMenuImageUpdateEntry(before, after);
    if (entry) await store.recordVendorUpdate(vendorSlug, { announce: options.announce, entry });
  }
  return removed;
}
