"use server";

import { revalidatePath } from "next/cache";

import {
  deleteSiteTranslation,
  upsertSiteTranslation,
} from "@/lib/operator-client";

export async function saveSiteTranslationAction(
  locale: string,
  key: string,
  value: string
) {
  const translation = await upsertSiteTranslation(locale, key, value);
  revalidatePath("/ops/settings");
  revalidatePath("/");
  return translation;
}

export async function deleteSiteTranslationAction(locale: string, key: string) {
  const deleted = await deleteSiteTranslation(locale, key);
  revalidatePath("/ops/settings");
  revalidatePath("/");
  return deleted;
}
