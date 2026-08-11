"use server";

import { revalidatePath } from "next/cache";

import type {
  CreateLeadRoutingRecipientInput,
  LeadStatus,
  UpdateLeadRoutingRecipientInput,
} from "@/lib/leads/types";
import {
  createLeadRoutingRecipient,
  deleteLeadRoutingRecipient,
  patchLeadRoutingRecipient,
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

export async function createLeadRoutingRecipientAction(
  input: CreateLeadRoutingRecipientInput
) {
  const recipient = await createLeadRoutingRecipient(input);
  revalidatePath("/ops/settings");
  return recipient;
}

export async function patchLeadRoutingRecipientAction(
  recipientId: string,
  input: UpdateLeadRoutingRecipientInput
) {
  const recipient = await patchLeadRoutingRecipient(recipientId, input);
  revalidatePath("/ops/settings");
  return recipient;
}

export async function removeLeadRoutingRecipientAction(recipientId: string) {
  await deleteLeadRoutingRecipient(recipientId);
  revalidatePath("/ops/settings");
}
