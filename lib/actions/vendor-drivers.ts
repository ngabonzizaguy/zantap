"use server";

import { getStore } from "@/lib/store";
import type { CreateDriverInput, Driver, Order, UpdateDriverInput } from "@/lib/types";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";
import {
  deriveDriverInitials,
  normalizeDriverName,
} from "@/lib/vendor/driver-display";
import { canonicalizePhone } from "@/lib/format";

function validateDriverName(name: string): string | null {
  const normalized = normalizeDriverName(name);
  if (!normalized) return "Driver name is required";
  return null;
}

function validateDriverPhone(phone: string): string | null {
  if (!canonicalizePhone(phone, "250")) {
    return "Valid driver phone is required";
  }
  return null;
}

export async function loadDrivers(vendorSlug: string): Promise<Driver[]> {
  return getStore().getDrivers(vendorSlug);
}

export async function createDriver(
  ownerToken: string,
  vendorSlug: string,
  input: CreateDriverInput
): Promise<Driver> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const nameError = validateDriverName(input.name);
  if (nameError) throw new Error(nameError);
  const phoneError = validateDriverPhone(input.phone);
  if (phoneError) throw new Error(phoneError);
  return getStore().createDriver(vendorSlug, {
    name: normalizeDriverName(input.name),
    phone: input.phone.trim(),
  });
}

export async function updateDriver(
  ownerToken: string,
  vendorSlug: string,
  driverId: string,
  input: UpdateDriverInput
): Promise<Driver | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  if (input.name !== undefined) {
    const nameError = validateDriverName(input.name);
    if (nameError) throw new Error(nameError);
  }
  if (input.phone !== undefined) {
    const phoneError = validateDriverPhone(input.phone);
    if (phoneError) throw new Error(phoneError);
  }
  return getStore().updateDriver(vendorSlug, driverId, {
    name:
      input.name !== undefined ? normalizeDriverName(input.name) : undefined,
    phone: input.phone?.trim(),
  });
}

export async function deleteDriver(
  ownerToken: string,
  vendorSlug: string,
  driverId: string
): Promise<boolean> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().deleteDriver(vendorSlug, driverId);
}

export async function assignOrderDriver(
  ownerToken: string,
  vendorSlug: string,
  orderId: string,
  driverId: string
): Promise<Order | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().assignOrderDriver(orderId, driverId);
}

export async function bulkAssignOrderDriver(
  ownerToken: string,
  vendorSlug: string,
  orderIds: string[],
  driverId: string
): Promise<Order[]> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().bulkAssignOrderDriver(orderIds, driverId);
}
