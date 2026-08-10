"use server";

import { revalidatePath } from "next/cache";

import type {
  LeadStatus,
  UpdateLeadRoutingSettingsInput,
} from "@/lib/leads/types";
import {
  patchLeadRoutingSettings,
  patchLeadStatus,
} from "@/lib/operator-client";

export async function patchLeadStatusAction(
  leadId: string,
  status: LeadStatus
) {
  const lead = await patchLeadStatus(leadId, status);
  revalidatePath("/ops/leads");
  return lead;
}

export async function patchLeadRoutingSettingsAction(
  input: UpdateLeadRoutingSettingsInput
) {
  const settings = await patchLeadRoutingSettings(input);
  revalidatePath("/ops/settings");
  return settings;
}
