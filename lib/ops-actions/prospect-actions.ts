"use server";

import { revalidatePath } from "next/cache";

import {
  addProspectInteraction,
  bulkCreateProspects,
  convertProspect,
  createProspect,
  patchProspect,
} from "@/lib/operator-client";
import type {
  CreateProspectInput,
  CreateProspectInteractionInput,
  UpdateProspectInput,
} from "@/lib/prospects/types";

export async function createProspectAction(input: CreateProspectInput) {
  const prospect = await createProspect(input);
  revalidatePath("/ops/prospects");
  return prospect;
}

export async function bulkCreateProspectsAction(rows: CreateProspectInput[]) {
  const prospects = await bulkCreateProspects(rows);
  revalidatePath("/ops/prospects");
  return prospects;
}

export async function patchProspectAction(
  prospectId: string,
  input: UpdateProspectInput
) {
  const prospect = await patchProspect(prospectId, input);
  revalidatePath("/ops/prospects");
  return prospect;
}

export async function addProspectInteractionAction(
  prospectId: string,
  input: CreateProspectInteractionInput
) {
  const interaction = await addProspectInteraction(prospectId, input);
  revalidatePath("/ops/prospects");
  return interaction;
}

export async function convertProspectAction(
  prospectId: string,
  vendorId: string,
  leadId?: string
) {
  const prospect = await convertProspect(prospectId, vendorId, leadId);
  revalidatePath("/ops/prospects");
  return prospect;
}
