"use server";

import {
  reactivateVendor,
  suspendVendor,
  patchVendor,
  revokeOwnerToken,
  reissueOwnerToken,
  reviewRecoveryEvent,
  patchOrder,
  patchMenuItem,
  archiveMenuItem,
  toggleMenuAvailability,
  vendorPayoutAction,
} from "@/lib/operator-client";
import type {
  OperatorOrderPatch,
  OperatorUpdateVendorInput,
  UpdateMenuItemInput,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function suspendVendorAction(slug: string, reason?: string) {
  await suspendVendor(slug, reason);
  revalidatePath("/ops");
  revalidatePath(`/ops/vendors/${slug}`);
  revalidatePath(`/${slug}`);
}

export async function reactivateVendorAction(slug: string) {
  await reactivateVendor(slug);
  revalidatePath("/ops");
  revalidatePath(`/ops/vendors/${slug}`);
  revalidatePath(`/${slug}`);
}

export async function patchVendorAction(
  slug: string,
  input: OperatorUpdateVendorInput
) {
  const updated = await patchVendor(slug, input);
  revalidatePath(`/ops/vendors/${slug}`);
  revalidatePath(`/${slug}`);
  return updated;
}

export async function revokeOwnerTokenAction(slug: string) {
  await revokeOwnerToken(slug);
  revalidatePath(`/ops/vendors/${slug}`);
}

export async function reissueOwnerTokenAction(slug: string) {
  const result = await reissueOwnerToken(slug);
  revalidatePath(`/ops/vendors/${slug}`);
  return result;
}

export async function reviewRecoveryEventAction(
  eventId: string,
  reviewNote?: string
) {
  await reviewRecoveryEvent(eventId, reviewNote);
  revalidatePath("/ops/recovery");
}

export async function patchOrderAction(orderId: string, patch: OperatorOrderPatch) {
  await patchOrder(orderId, patch);
  revalidatePath("/ops");
}

export async function patchMenuItemAction(
  slug: string,
  itemId: string,
  patch: UpdateMenuItemInput
) {
  const item = await patchMenuItem(slug, itemId, patch);
  revalidatePath(`/ops/vendors/${slug}`);
  return item;
}

export async function archiveMenuItemAction(slug: string, itemId: string) {
  const item = await archiveMenuItem(slug, itemId);
  revalidatePath(`/ops/vendors/${slug}`);
  return item;
}

export async function toggleMenuAvailabilityAction(slug: string, itemId: string) {
  const item = await toggleMenuAvailability(slug, itemId);
  revalidatePath(`/ops/vendors/${slug}`);
  return item;
}

export async function vendorPayoutActionForOrder(
  slug: string,
  orderId: string,
  action: "retry" | "sync",
) {
  const result = await vendorPayoutAction(orderId, action);
  revalidatePath(`/ops/vendors/${slug}`);
  return result;
}
