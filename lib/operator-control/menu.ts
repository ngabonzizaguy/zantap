import { getStore } from "@/lib/store";
import type { MenuItem, UpdateMenuItemInput } from "@/lib/types";
import { auditOperatorAction } from "@/lib/operator-control/audit";

export async function listOperatorMenu(slug: string): Promise<MenuItem[]> {
  return getStore().getMenu(slug);
}

export async function patchOperatorMenuItem(
  slug: string,
  itemId: string,
  input: UpdateMenuItemInput
): Promise<MenuItem | null> {
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) return null;

  const updated = await store.updateMenuItem(slug, itemId, input);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: vendor.id,
    action: "MENU_OVERRIDE",
    detail: { slug, itemId, fields: Object.keys(input) },
  });
  return updated;
}

export async function archiveOperatorMenuItem(
  slug: string,
  itemId: string
): Promise<MenuItem | null> {
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) return null;

  const updated = await store.archiveMenuItem(slug, itemId);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: vendor.id,
    action: "MENU_ARCHIVE",
    detail: { slug, itemId },
  });
  return updated;
}

export async function toggleOperatorMenuAvailability(
  slug: string,
  itemId: string
): Promise<MenuItem | null> {
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) return null;

  const updated = await store.toggleItemAvailability(slug, itemId);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: vendor.id,
    action: "MENU_TOGGLE_AVAILABILITY",
    detail: { slug, itemId, isAvailable: updated.isAvailable },
  });
  return updated;
}
