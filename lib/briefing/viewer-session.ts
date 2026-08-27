import "server-only";

import { cookies } from "next/headers";

import { validateBriefingAccessSession } from "@/lib/briefing/access-service";
import {
  briefingDocumentFromJson,
  DEFAULT_BRIEFING_DOCUMENT,
  type BriefingDocument,
} from "@/lib/briefing/content";
import {
  getBriefingPreviewConfig,
  hasBriefingPreviewSession,
  isBriefingPreviewExpired,
} from "@/lib/briefing/preview-access";
import type { BriefingAccessGrant, BriefingSession } from "@/lib/briefing/types";
import { getStore } from "@/lib/store";

export const BRIEFING_SESSION_COOKIE = "zantap_briefing_session";

export interface BriefingViewerContext {
  recipient: string;
  expiresAt: Date;
  document: BriefingDocument;
  grant?: BriefingAccessGrant;
  session?: BriefingSession;
  source: "grant" | "preview";
}

export async function getBriefingViewerContext(): Promise<BriefingViewerContext | null> {
  const token = (await cookies()).get(BRIEFING_SESSION_COOKIE)?.value ?? "";
  if (token) {
    const access = await validateBriefingAccessSession(getStore().briefing, token);
    if (access) {
      return {
        recipient: access.grant.recipientLabel,
        expiresAt: access.grant.expiresAt,
        document: briefingDocumentFromJson(access.version.content),
        grant: access.grant,
        session: access.session,
        source: "grant",
      };
    }
  }

  const preview = getBriefingPreviewConfig();
  if (
    preview &&
    !isBriefingPreviewExpired(preview) &&
    (await hasBriefingPreviewSession())
  ) {
    return {
      recipient: preview.recipient,
      expiresAt: preview.expiresAt,
      document: structuredClone(DEFAULT_BRIEFING_DOCUMENT),
      source: "preview",
    };
  }
  return null;
}
