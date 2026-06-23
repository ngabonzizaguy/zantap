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
import { assertWriteSecret } from "@/lib/vendor/write-secret";

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
  writeSecret: string,
  vendorSlug: string,
  input: CreateMenuItemInput
): Promise<MenuItem> {
  assertWriteSecret(writeSecret);
  const validationError = validateCreateMenuItemInput(input);
  if (validationError) {
    throw new Error(validationError);
  }
  return getStore().createMenuItem(vendorSlug, {
    name: input.name.trim(),
    priceRwf: input.priceRwf,
    description: input.description?.trim() || undefined,
    category: input.category?.trim() || "General",
  });
}

export async function updateMenuItem(
  writeSecret: string,
  vendorSlug: string,
  itemId: string,
  input: UpdateMenuItemInput
): Promise<MenuItem | null> {
  assertWriteSecret(writeSecret);
  const validationError = validateUpdateMenuItemInput(input);
  if (validationError) {
    throw new Error(validationError);
  }
  return getStore().updateMenuItem(vendorSlug, itemId, {
    name: input.name?.trim(),
    priceRwf: input.priceRwf,
    description:
      input.description !== undefined
        ? input.description.trim() || undefined
        : undefined,
    category:
      input.category !== undefined
        ? input.category.trim() || "General"
        : undefined,
  });
}

export async function archiveMenuItem(
  writeSecret: string,
  vendorSlug: string,
  itemId: string
): Promise<MenuItem | null> {
  assertWriteSecret(writeSecret);
  return getStore().archiveMenuItem(vendorSlug, itemId);
}

export async function restoreMenuItem(
  writeSecret: string,
  vendorSlug: string,
  itemId: string
): Promise<MenuItem | null> {
  assertWriteSecret(writeSecret);
  return getStore().restoreMenuItem(vendorSlug, itemId);
}

export async function renameCategory(
  writeSecret: string,
  vendorSlug: string,
  from: string,
  to: string
): Promise<number> {
  assertWriteSecret(writeSecret);
  return getStore().renameCategory(vendorSlug, from, to);
}

export async function addMenuImageByUrl(
  writeSecret: string,
  vendorSlug: string,
  itemId: string,
  url: string
): Promise<MenuImage> {
  assertWriteSecret(writeSecret);
  const trimmed = url.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Valid image URL required");
  }
  return getStore().addMenuImage(vendorSlug, itemId, { url: trimmed });
}

export async function uploadMenuImage(
  writeSecret: string,
  vendorSlug: string,
  itemId: string,
  formData: FormData
): Promise<MenuImage> {
  assertWriteSecret(writeSecret);
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No image file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validationError = validateMenuImageFile(buffer.byteLength, file.type);
  if (validationError) {
    throw new Error(validationError);
  }

  return getStore().uploadMenuImageBlob(
    vendorSlug,
    itemId,
    buffer,
    file.type
  );
}

export async function reorderMenuImages(
  writeSecret: string,
  vendorSlug: string,
  itemId: string,
  imageIds: string[]
): Promise<MenuImage[]> {
  assertWriteSecret(writeSecret);
  return getStore().reorderMenuImages(vendorSlug, itemId, imageIds);
}

export async function setPrimaryMenuImage(
  writeSecret: string,
  vendorSlug: string,
  itemId: string,
  imageId: string
): Promise<MenuImage | null> {
  assertWriteSecret(writeSecret);
  return getStore().setPrimaryMenuImage(vendorSlug, itemId, imageId);
}

export async function removeMenuImage(
  writeSecret: string,
  vendorSlug: string,
  itemId: string,
  imageId: string
): Promise<boolean> {
  assertWriteSecret(writeSecret);
  return getStore().removeMenuImage(vendorSlug, itemId, imageId);
}
