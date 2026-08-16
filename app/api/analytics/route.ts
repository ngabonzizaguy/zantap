import { NextResponse } from "next/server";
import { parseMarketingEvent } from "@/lib/analytics/types";
import { getStore } from "@/lib/store";

const recent = new Map<string, number[]>();

export async function POST(request: Request) {
  const input = parseMarketingEvent(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const agent = request.headers.get("user-agent") ?? "";
  if (/bot|crawler|spider|preview/i.test(agent)) return new NextResponse(null, { status: 204 });

  const now = Date.now();
  const timestamps = (recent.get(input.sessionId) ?? []).filter((at) => now - at < 60_000);
  if (timestamps.length >= 60) return new NextResponse(null, { status: 204 });
  timestamps.push(now);
  recent.set(input.sessionId, timestamps);

  await getStore().recordMarketingFunnelEvent(input);
  return new NextResponse(null, { status: 204 });
}
