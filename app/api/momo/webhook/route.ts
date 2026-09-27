import { NextResponse } from "next/server";
import {
  handleMomoWebhook,
  type MomoWebhookPayload,
} from "@/lib/momo/open-api-webhook";

/**
 * MTN MoMo async callback target (X-Callback-Url / providerCallbackHost path).
 * Collection and Disbursement both POST here with 202-follow-up payloads.
 *
 * Always return 200 when the body is parseable so MTN does not hammer retries
 * for unknown Transfer refs we do not store yet.
 */
export async function POST(request: Request) {
  let payload: MomoWebhookPayload;
  try {
    payload = (await request.json()) as MomoWebhookPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const referenceIdHeader =
    request.headers.get("x-reference-id") ??
    request.headers.get("X-Reference-Id");

  try {
    const result = await handleMomoWebhook(payload, { referenceIdHeader });
    console.info("[momo:webhook]", result.outcome, result.message, result.payout);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    console.error("[momo:webhook]", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
