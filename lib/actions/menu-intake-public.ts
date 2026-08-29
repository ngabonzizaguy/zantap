"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import type {
  SubmitMenuIntakeInput,
  MenuIntakeRevisionContent,
  SubmitMenuIntakeRevisionResult,
  SubmitMenuIntakeResult,
} from "@/lib/menu-intake/types";
import {
  validateMenuIntakeContent,
  validateMenuIntakeSubmission,
} from "@/lib/menu-intake/workflow";
import { getStore } from "@/lib/store";
import { hashOwnerToken, mintOwnerToken } from "@/lib/vendor/owner-token";
import { enforceRateLimit, RateLimitError } from "@/lib/vendor/rate-limit";
import {
  buildMenuIntakeBlobPath,
  deletePrivateMenuIntakeBlob,
  putPrivateMenuIntakeBlob,
  sanitizeMenuIntakeImage,
} from "@/lib/menu-intake/blob-storage";
import { validateMenuIntakeUpload } from "@/lib/menu-intake/uploads";

// NOTE: export only async Server Actions — no type/value re-exports (AGENTS.md).

const RESUME_TTL_MS = 30 * 24 * 60 * 60_000;
const IP_LIMIT = 8;
const IP_WINDOW_MS = 15 * 60_000;
const PHONE_LIMIT = 3;
const PHONE_WINDOW_MS = 60 * 60_000;

async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return (forwarded || requestHeaders.get("x-real-ip") || "unknown").slice(
    0,
    100,
  );
}

function createReference(now: Date): string {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "");
  return `MI-${date}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

/** Stage a public Vendor menu submission; never creates live Vendor/Menu rows. */
export async function submitMenuIntake(
  input: SubmitMenuIntakeInput,
): Promise<SubmitMenuIntakeResult> {
  if (typeof input?.website === "string" && input.website.trim()) {
    return {
      ok: true,
      intakeId: "received",
      reference: "MI-RECEIVED",
      resumeToken: "",
      status: "SUBMITTED",
    };
  }

  const parsed = validateMenuIntakeSubmission(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, message: parsed.message };
  }

  try {
    const ip = await getClientIp();
    enforceRateLimit(`menu-intake:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
    enforceRateLimit(
      `menu-intake:phone:${parsed.value.phone}`,
      PHONE_LIMIT,
      PHONE_WINDOW_MS,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: "SUBMISSION_FAILED" };
  }

  try {
    const now = new Date();
    const { token: resumeToken, hash: resumeTokenHash } = mintOwnerToken();
    const created = await getStore().createMenuIntake({
      ...parsed.value,
      reference: createReference(now),
      resumeTokenHash,
      resumeExpiresAt: new Date(now.getTime() + RESUME_TTL_MS),
    });
    return {
      ok: true,
      intakeId: created.intake.id,
      reference: created.intake.reference,
      resumeToken,
      status: "SUBMITTED",
    };
  } catch {
    return { ok: false, error: "SUBMISSION_FAILED" };
  }
}

export async function submitMenuIntakeRevision(
  intakeId: string,
  resumeToken: string,
  content: MenuIntakeRevisionContent,
): Promise<SubmitMenuIntakeRevisionResult> {
  const parsed = validateMenuIntakeContent(content);
  if (!parsed.ok) return parsed;
  try {
    const ip = await getClientIp();
    enforceRateLimit(
      `menu-intake:revision:${intakeId}:${ip}`,
      IP_LIMIT,
      IP_WINDOW_MS,
    );
    const current = await getStore().getMenuIntake(intakeId);
    if (!current) return { ok: false, error: "INVALID_ACCESS" };
    if (["IMPORTING", "CANCELLED"].includes(current.intake.status)) {
      return { ok: false, error: "LOCKED" };
    }
    const result = await getStore().addMenuIntakeRevision({
      intakeId,
      resumeTokenHash: hashOwnerToken(resumeToken),
      content: parsed.value,
      at: new Date(),
    });
    if (!result) return { ok: false, error: "INVALID_ACCESS" };
    return {
      ok: true,
      intakeId,
      reference: result.intake.reference,
      revision: result.revision.sequence,
      status: result.intake.status,
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: "SUBMISSION_FAILED" };
  }
}

export async function getMenuIntakeStatus(
  intakeId: string,
  resumeToken: string,
) {
  if (!intakeId || !resumeToken)
    return { ok: false as const, error: "INVALID_ACCESS" as const };
  const detail = await getStore().authorizeMenuIntake(
    intakeId,
    hashOwnerToken(resumeToken),
    new Date(),
  );
  if (!detail) return { ok: false as const, error: "INVALID_ACCESS" as const };
  return {
    ok: true as const,
    intake: detail.intake,
    revision: detail.revisions.at(-1),
    attachments: detail.attachments.map(
      ({ blobPath: _blobPath, ...attachment }) => attachment,
    ),
  };
}

export async function exchangeMenuIntakeResume(
  intakeId: string,
  oneTimeToken: string,
) {
  const { token: browserToken, hash: browserTokenHash } = mintOwnerToken();
  const detail = await getStore().exchangeMenuIntakeAccess(
    intakeId,
    hashOwnerToken(oneTimeToken),
    browserTokenHash,
    new Date(),
  );
  if (!detail) return { ok: false as const, error: "INVALID_ACCESS" };
  return {
    ok: true as const,
    resumeToken: browserToken,
    reference: detail.intake.reference,
    status: detail.intake.status,
  };
}

export async function uploadMenuIntakeAttachment(formData: FormData) {
  const intakeId = String(formData.get("intakeId") ?? "");
  const resumeToken = String(formData.get("resumeToken") ?? "");
  const kind = formData.get("kind") === "DISH_IMAGE" ? "DISH_IMAGE" : "SOURCE";
  const dishClientId = String(formData.get("dishClientId") ?? "") || undefined;
  const file = formData.get("file");
  if (!(file instanceof File) || !intakeId || !resumeToken) {
    return { ok: false as const, error: "INVALID_UPLOAD" };
  }
  const tokenHash = hashOwnerToken(resumeToken);
  const detail = await getStore().authorizeMenuIntake(
    intakeId,
    tokenHash,
    new Date(),
  );
  if (!detail) return { ok: false as const, error: "INVALID_ACCESS" };
  const existing = detail.attachments.filter(
    (row) =>
      row.kind === kind &&
      (kind === "SOURCE" || row.dishClientId === dishClientId),
  );
  const error = validateMenuIntakeUpload({
    kind,
    mime: file.type,
    byteLength: file.size,
    existingFileCount: existing.length,
    existingTotalBytes: existing.reduce((sum, row) => sum + row.byteLength, 0),
  });
  if (error)
    return { ok: false as const, error: "INVALID_UPLOAD", message: error };

  let body = Buffer.from(await file.arrayBuffer());
  if (file.type.startsWith("image/"))
    body = Buffer.from(await sanitizeMenuIntakeImage(body, file.type));
  const blobPath = buildMenuIntakeBlobPath(intakeId, file.name);
  await putPrivateMenuIntakeBlob(blobPath, body, file.type);
  const attachment = await getStore().addMenuIntakeAttachment({
    intakeId,
    resumeTokenHash: tokenHash,
    kind,
    dishClientId,
    fileName: file.name.slice(0, 200),
    mime: file.type,
    byteLength: body.byteLength,
    blobPath,
    at: new Date(),
  });
  if (!attachment) {
    await deletePrivateMenuIntakeBlob(blobPath);
    return { ok: false as const, error: "INVALID_ACCESS" };
  }
  return { ok: true as const, attachmentId: attachment.id };
}

export async function removeMenuIntakeAttachment(
  intakeId: string,
  attachmentId: string,
  resumeToken: string,
) {
  const removed = await getStore().removeMenuIntakeAttachment(
    intakeId,
    attachmentId,
    hashOwnerToken(resumeToken),
    new Date(),
  );
  if (!removed) return { ok: false as const, error: "INVALID_ACCESS" };
  await deletePrivateMenuIntakeBlob(removed.blobPath);
  return { ok: true as const };
}
