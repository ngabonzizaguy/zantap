"use server";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { unlockBriefingAccess, validateBriefingAccessSession } from "@/lib/briefing/access-service";
import { DEFAULT_BRIEFING_DOCUMENT } from "@/lib/briefing/content";
import type { BriefingJson } from "@/lib/briefing/types";
import {
  BRIEFING_PREVIEW_COOKIE,
  createBriefingPreviewSessionToken,
  getBriefingPreviewConfig,
  verifyBriefingPreviewSecret,
} from "@/lib/briefing/preview-access";
import { BRIEFING_SESSION_COOKIE } from "@/lib/briefing/viewer-session";
import { getStore } from "@/lib/store";
import { enforceRateLimit, RateLimitError } from "@/lib/vendor/rate-limit";

const BRIEFING_UNLOCK_LIMIT = 8;
const BRIEFING_UNLOCK_WINDOW_MS = 15 * 60_000;

export async function unlockBriefing(formData: FormData): Promise<void> {
  const secret = String(formData.get("secret") ?? "");
  const store = getStore();
  await store.briefing.ensure(
    structuredClone(DEFAULT_BRIEFING_DOCUMENT) as unknown as BriefingJson
  );
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const networkFingerprint = ip
    ? createHash("sha256")
        .update(`${process.env.OPERATOR_UI_SECRET ?? "zantap"}:${ip}`)
        .digest("base64url")
        .slice(0, 20)
    : undefined;
  try {
    enforceRateLimit(
      `briefing:unlock:${networkFingerprint ?? "unknown"}`,
      BRIEFING_UNLOCK_LIMIT,
      BRIEFING_UNLOCK_WINDOW_MS,
    );
  } catch (error) {
    if (error instanceof RateLimitError) redirect("/briefing?error=rate_limited");
    throw error;
  }
  const result = await unlockBriefingAccess(store.briefing, secret, {
    userAgent: requestHeaders.get("user-agent") ?? undefined,
    networkFingerprint,
  });

  if (result.ok) {
    (await cookies()).set(BRIEFING_SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: result.grant.expiresAt,
      path: "/briefing",
    });
    redirect("/briefing");
  }

  const preview = getBriefingPreviewConfig();
  if (preview && verifyBriefingPreviewSecret(secret)) {
    const token = createBriefingPreviewSessionToken();
    if (token) {
      (await cookies()).set(BRIEFING_PREVIEW_COOKIE, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        expires: preview.expiresAt,
        path: "/briefing",
      });
      redirect("/briefing");
    }
  }
  redirect(`/briefing?error=${result.code.toLowerCase()}`);
}

export async function acknowledgeBriefingAccess(): Promise<void> {
  const token = (await cookies()).get(BRIEFING_SESSION_COOKIE)?.value ?? "";
  const store = getStore();
  const access = await validateBriefingAccessSession(store.briefing, token);
  if (!access) redirect("/briefing?error=invalid");
  await store.briefing.updateSession(access.session.id, { acknowledgedAt: new Date() });
  await store.briefing.recordActivity({
    grantId: access.grant.id,
    sessionId: access.session.id,
    type: "VIEWER_ACKNOWLEDGED",
  });
  redirect("/briefing");
}
