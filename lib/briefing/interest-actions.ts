"use server";

import { revalidatePath } from "next/cache";

import {
  BRIEFING_INTEREST_TYPES,
  submitBriefingInterest,
  type BriefingInterestActionState,
  type BriefingInterestType,
} from "@/lib/briefing/interest";
import { getStore } from "@/lib/store";
import { getBriefingViewerContext } from "@/lib/briefing/viewer-session";

export async function submitBriefingInterestAction(
  _state: BriefingInterestActionState,
  formData: FormData
): Promise<BriefingInterestActionState> {
  const interestType = String(formData.get("interestType") ?? "") as BriefingInterestType;
  if (!BRIEFING_INTEREST_TYPES.includes(interestType)) {
    return { status: "error", message: "Choose how you would like to participate." };
  }

  const store = getStore();
  try {
    const viewer = await getBriefingViewerContext();
    await submitBriefingInterest(
      {
        grantId: viewer?.grant?.id,
        name: String(formData.get("name") ?? ""),
        contact: String(formData.get("contact") ?? ""),
        interestType,
        message: String(formData.get("message") ?? ""),
      },
      {
        create: (input) => store.createBriefingInterest(input),
      }
    );
    revalidatePath("/ops/briefing");
    return {
      status: "success",
      message: "Thank you. Your message is safely recorded for ZanTap follow-up.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not record your message.",
    };
  }
}
