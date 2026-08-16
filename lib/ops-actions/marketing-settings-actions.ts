"use server";

import { revalidatePath } from "next/cache";

import { patchMarketingSiteSettings } from "@/lib/operator-client";
import type { UpdateMarketingSiteSettingsInput } from "@/lib/vendor/feature-and-profit-types";

export async function patchMarketingSiteSettingsAction(
  input: UpdateMarketingSiteSettingsInput
) {
  const settings = await patchMarketingSiteSettings(input);
  revalidatePath("/ops/settings");
  revalidatePath("/");
  return settings;
}
