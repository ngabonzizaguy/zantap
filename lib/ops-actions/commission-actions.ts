"use server";

import { revalidatePath } from "next/cache";

import { getStore } from "@/lib/store";
import type { UpdateCommissionSettingsInput } from "@/lib/momo/commission";

export async function updateCommissionSettingsAction(
  input: UpdateCommissionSettingsInput
) {
  const store = getStore();
  const settings = await store.updateCommissionSettings(input);
  revalidatePath("/ops/settings");
  revalidatePath("/vendor/[slug]", "page");
  return settings;
}

export async function getCommissionSettingsAction() {
  const store = getStore();
  return await store.getCommissionSettings();
}
