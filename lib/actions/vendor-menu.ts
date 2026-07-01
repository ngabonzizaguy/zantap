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
  input: CreateMenuItemInput
): Promise<MenuItem> {
  await assertOwnerToken(vendorSlug, ownerToken);
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
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  input: UpdateMenuItemInput
): Promise<MenuItem | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
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
  itemId: string
): Promise<MenuItem | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().restoreMenuItem(vendorSlug, itemId);
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

export async function addMenuImageByUrl(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  url: string
): Promise<MenuImage> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const trimmed = url.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Valid image URL required");
  }
  return getStore().addMenuImage(vendorSlug, itemId, { url: trimmed });
}

export async function uploadMenuImage(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  formData: FormData
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

  return getStore().uploadMenuImageBlob(
    vendorSlug,
    itemId,
    buffer,
    file.type
  );
}

export async function reorderMenuImages(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  imageIds: string[]
): Promise<MenuImage[]> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().reorderMenuImages(vendorSlug, itemId, imageIds);
}

export async function setPrimaryMenuImage(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  imageId: string
): Promise<MenuImage | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().setPrimaryMenuImage(vendorSlug, itemId, imageId);
}

export async function removeMenuImage(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  imageId: string
): Promise<boolean> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().removeMenuImage(vendorSlug, itemId, imageId);
}
