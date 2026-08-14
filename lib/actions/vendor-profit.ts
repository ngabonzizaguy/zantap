"use server";

import { getStore } from "@/lib/store";
import type { ProfitSnapshot, VendorExpense, CreateVendorExpenseInput } from "@/lib/vendor/feature-and-profit-types";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";

export async function loadProfitSnapshot(
  vendorSlug: string,
  from: Date,
  to: Date
): Promise<ProfitSnapshot | null> {
  return getStore().getProfitSnapshot(vendorSlug, from, to);
}

export async function loadWeekdayAverageGross(
  vendorSlug: string
): Promise<number> {
  return getStore().getWeekdayAverageGross(vendorSlug);
}

export async function loadAllTimePaidRevenue(
  vendorSlug: string
): Promise<number> {
  return getStore().getAllTimePaidRevenue(vendorSlug);
}

export async function loadVendorExpenses(
  vendorSlug: string,
  from?: Date,
  to?: Date
): Promise<VendorExpense[]> {
  return getStore().listVendorExpenses(vendorSlug, from, to);
}

export async function createVendorExpense(
  ownerToken: string,
  vendorSlug: string,
  input: CreateVendorExpenseInput
): Promise<VendorExpense> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().createVendorExpense(vendorSlug, input);
}

export async function deleteVendorExpense(
  ownerToken: string,
  vendorSlug: string,
  expenseId: string
): Promise<boolean> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().deleteVendorExpense(vendorSlug, expenseId);
}
