"use server";

import { revalidatePath } from "next/cache";
import { isOpsSessionValid } from "@/lib/ops-auth/session";

import {
  deleteSiteTranslation,
  upsertSiteTranslation,
} from "@/lib/operator-client";

export async function saveSiteTranslationAction(
  locale: string,
  key: string,
  value: string
) {
  if (!(await isOpsSessionValid())) throw new Error("Operator sign in required.");
  const translation = await upsertSiteTranslation(locale, key, value);
  revalidatePath("/ops/settings");
  revalidatePath("/vendor/[slug]", "page");
  revalidatePath("/");
  return translation;
}

export async function deleteSiteTranslationAction(locale: string, key: string) {
  if (!(await isOpsSessionValid())) throw new Error("Operator sign in required.");
  const deleted = await deleteSiteTranslation(locale, key);
  revalidatePath("/ops/settings");
  revalidatePath("/vendor/[slug]", "page");
  revalidatePath("/");
  return deleted;
}
