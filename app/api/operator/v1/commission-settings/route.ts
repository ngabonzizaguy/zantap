import { NextRequest, NextResponse } from "next/server";

import { getStore } from "@/lib/store";
import type { UpdateCommissionSettingsInput } from "@/lib/momo/commission";

export async function GET() {
  try {
    const store = getStore();
    const settings = await store.getCommissionSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /commission-settings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const input: UpdateCommissionSettingsInput = await request.json();
    const store = getStore();
    const settings = await store.updateCommissionSettings(input);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("PATCH /commission-settings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
