"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isOpsSessionValid } from "@/lib/ops-auth/session";
import { getStore } from "@/lib/store";
import type {
  MenuIntakeImportItem,
  MenuIntakeRevisionContent,
  MenuIntakeStatus,
} from "@/lib/menu-intake/types";
import { validateMenuIntakeContent } from "@/lib/menu-intake/workflow";
import { mintOwnerToken } from "@/lib/vendor/owner-token";
import { getBaseUrl } from "@/lib/base-url";

async function assertOps(): Promise<void> {
  if (!(await isOpsSessionValid())) throw new Error("Unauthorized");
}

export async function reviewMenuIntakeAction(formData: FormData) {
  await assertOps();
  const intakeId = String(formData.get("intakeId") ?? "");
  const status = String(
    formData.get("status") ?? "IN_REVIEW",
  ) as MenuIntakeStatus;
  const allowed = [
    "IN_REVIEW",
    "NEEDS_INFORMATION",
    "READY_TO_IMPORT",
    "CANCELLED",
  ];
  if (!allowed.includes(status))
    return { ok: false as const, error: "Invalid status" };
  let content: MenuIntakeRevisionContent | undefined;
  const contentJson = String(formData.get("content") ?? "");
  if (contentJson) {
    try {
      const checked = validateMenuIntakeContent(JSON.parse(contentJson));
      if (!checked.ok) return { ok: false as const, error: checked.message };
      content = checked.value;
    } catch {
      return { ok: false as const, error: "Invalid reviewed menu" };
    }
  }
  const detail = await getStore().updateMenuIntakeReview({
    intakeId,
    status: status as
      "IN_REVIEW" | "NEEDS_INFORMATION" | "READY_TO_IMPORT" | "CANCELLED",
    content,
    destinationVendorSlug:
      String(formData.get("destinationVendorSlug") ?? "") || undefined,
    operator: "Ops",
    at: new Date(),
  });
  if (!detail)
    return { ok: false as const, error: "Intake or Vendor not found" };
  revalidatePath("/ops/menu-intakes");
  return { ok: true as const };
}

export async function answerMenuIntakeQuestionAction(formData: FormData) {
  await assertOps();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) return { ok: false as const, error: "Answer is required" };
  const question = await getStore().answerMenuIntakeQuestion({
    intakeId: String(formData.get("intakeId") ?? ""),
    questionId: String(formData.get("questionId") ?? ""),
    answer,
    operator: "Ops",
    status:
      formData.get("needsFollowUp") === "on" ? "NEEDS_FOLLOW_UP" : "ANSWERED",
    deliveryMethod: String(formData.get("deliveryMethod") ?? "WHATSAPP") as
      "WHATSAPP" | "CALL" | "MANUAL",
    at: new Date(),
  });
  if (!question) return { ok: false as const, error: "Question not found" };
  revalidatePath("/ops/menu-intakes");
  return { ok: true as const };
}

export async function importMenuIntakeAction(formData: FormData) {
  await assertOps();
  const intakeId = String(formData.get("intakeId") ?? "");
  const detail = await getStore().getMenuIntake(intakeId);
  if (!detail) return { ok: false as const, error: "Intake not found" };
  let items: MenuIntakeImportItem[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false as const, error: "Invalid import decisions" };
  }
  const destinationMode = String(formData.get("destinationMode") ?? "EXISTING");
  const destination =
    destinationMode === "CREATE"
      ? {
          kind: "CREATE" as const,
          vendor: {
            name: String(
              formData.get("vendorName") ?? detail.intake.businessName,
            ),
            slug: String(formData.get("vendorSlug") ?? ""),
            phoneNumber: String(
              formData.get("vendorPhone") ?? detail.intake.phone,
            ),
            momoCode: String(formData.get("momoCode") ?? ""),
            ownerTokenHash: mintOwnerToken().hash,
          },
        }
      : {
          kind: "EXISTING" as const,
          vendorSlug: String(
            formData.get("vendorSlug") ??
              detail.intake.destinationVendorSlug ??
              "",
          ),
        };
  await getStore().updateMenuIntakeReview({
    intakeId,
    status: "READY_TO_IMPORT",
    destinationVendorSlug:
      destination.kind === "EXISTING" ? destination.vendorSlug : undefined,
    operator: "Ops",
    at: new Date(),
  });
  try {
    const result = await getStore().importMenuIntake({
      intakeId,
      idempotencyKey:
        String(formData.get("idempotencyKey") ?? "") || randomUUID(),
      destination,
      items,
    });
    revalidatePath("/ops/menu-intakes");
    revalidatePath(`/vendor/${result.vendorSlug}`);
    return { ok: true as const, result };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

export async function createMenuIntakeResumeLinkAction(intakeId: string) {
  await assertOps();
  const { token, hash } = mintOwnerToken();
  const access = await getStore().createMenuIntakeAccess({
    intakeId,
    tokenHash: hash,
    kind: "ONE_TIME",
    expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
    at: new Date(),
  });
  if (!access) return { ok: false as const, error: "Intake not found" };
  const origin = getBaseUrl();
  const path = `/menu-intake?intake=${encodeURIComponent(intakeId)}&token=${encodeURIComponent(token)}`;
  return { ok: true as const, url: origin ? `${origin}${path}` : path };
}

export async function revokeMenuIntakeAccessAction(intakeId: string) {
  await assertOps();
  const count = await getStore().revokeMenuIntakeAccess(intakeId, new Date());
  return { ok: true as const, count };
}

export async function logMenuIntakeNotificationAction(formData: FormData) {
  await assertOps();
  const intakeId = String(formData.get("intakeId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { ok: false as const, error: "Message is required" };
  await getStore().logMenuIntakeContact({
    intakeId,
    kind: "STATUS_NOTIFICATION",
    message,
    operatorId: "Ops",
    method: String(formData.get("method") ?? "WHATSAPP") as
      "WHATSAPP" | "CALL" | "MANUAL",
    at: new Date(),
  });
  revalidatePath("/ops/menu-intakes");
  return { ok: true as const };
}
