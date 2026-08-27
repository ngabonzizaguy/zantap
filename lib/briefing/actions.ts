"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BRIEFING_PREVIEW_COOKIE,
  createBriefingPreviewSessionToken,
  getBriefingPreviewConfig,
  verifyBriefingPreviewSecret,
} from "@/lib/briefing/preview-access";

export async function unlockBriefingPreview(formData: FormData): Promise<void> {
  const config = getBriefingPreviewConfig();
  const secret = String(formData.get("secret") ?? "");

  if (!config || config.expiresAt.getTime() <= Date.now()) {
    redirect("/briefing?state=expired");
  }
  if (!verifyBriefingPreviewSecret(secret)) {
    redirect("/briefing?error=invalid");
  }

  const token = createBriefingPreviewSessionToken();
  if (!token) redirect("/briefing?state=unavailable");

  const secondsUntilExpiry = Math.max(
    1,
    Math.floor((config.expiresAt.getTime() - Date.now()) / 1000)
  );
  (await cookies()).set(BRIEFING_PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/briefing",
    maxAge: Math.min(secondsUntilExpiry, 60 * 60 * 12),
  });
  redirect("/briefing");
}
