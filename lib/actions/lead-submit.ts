"use server";

import { headers } from "next/headers";

import { canonicalizePhone } from "@/lib/format";
import type {
  CreateLeadInput,
  SubmitLeadErrorCode,
  SubmitLeadInput,
  SubmitLeadResult,
} from "@/lib/leads/types";
import { getStore } from "@/lib/store";
import { buildLeadWhatsAppUrl } from "@/lib/whatsapp";
import {
  enforceRateLimit,
  RateLimitError,
} from "@/lib/vendor/rate-limit";

// NOTE: export only async Server Actions — no type/value re-exports (AGENTS.md).

const IP_LIMIT = 10;
const IP_WINDOW_MS = 15 * 60_000;
const PHONE_LIMIT = 3;
const PHONE_WINDOW_MS = 60 * 60_000;

type ParsedLead = Omit<CreateLeadInput, "consentAt">;

function cleanRequired(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) return null;
  return cleaned;
}

function cleanOptional(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
}

function parseLeadInput(
  input: SubmitLeadInput
): { ok: true; lead: ParsedLead } | { ok: false; error: SubmitLeadErrorCode } {
  const businessName = cleanRequired(input?.businessName, 120);
  const businessType = cleanRequired(input?.businessType, 80);
  const contactName = cleanRequired(input?.contactName, 100);
  const area = cleanRequired(input?.area, 120);
  if (!businessName || !businessType || !contactName || !area) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const phone = canonicalizePhone(
    typeof input?.phone === "string" ? input.phone : ""
  );
  if (!/^2507\d{8}$/.test(phone)) {
    return { ok: false, error: "INVALID_PHONE" };
  }

  return {
    ok: true,
    lead: {
      businessName,
      businessType,
      contactName,
      phone,
      area,
      message: cleanOptional(input.message, 500),
      source: cleanOptional(input.source, 80),
    },
  };
}

async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || requestHeaders.get("x-real-ip") || "unknown").slice(
    0,
    100
  );
}

/** Persist a public marketing setup request through the server-only Store seam. */
export async function submitLead(
  input: SubmitLeadInput
): Promise<SubmitLeadResult> {
  // Bot submissions receive an indistinguishable success and are discarded.
  if (typeof input?.website === "string" && input.website.trim()) {
    return { ok: true };
  }

  const parsed = parseLeadInput(input);
  if (!parsed.ok) return parsed;

  try {
    const ip = await getClientIp();
    enforceRateLimit(`lead:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
    enforceRateLimit(
      `lead:phone:${parsed.lead.phone}`,
      PHONE_LIMIT,
      PHONE_WINDOW_MS
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: "SUBMISSION_FAILED" };
  }

  try {
    const store = getStore();
    const lead = await store.createLead({
      ...parsed.lead,
      consentAt: new Date(),
    });

    // The Lead is already durable. A settings read or WhatsApp handoff problem
    // must never turn a successful partner request into a failed submission.
    try {
      const settings = await store.getLeadRoutingSettings();
      if (settings.whatsappEnabled && settings.whatsappPhone) {
        return {
          ok: true,
          whatsappUrl: buildLeadWhatsAppUrl(settings.whatsappPhone, lead),
        };
      }
    } catch {
      return { ok: true };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "SUBMISSION_FAILED" };
  }
}
