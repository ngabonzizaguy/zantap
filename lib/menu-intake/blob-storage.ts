import "server-only";

import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import sharp from "sharp";
import {
  deleteLocalBlob,
  getLocalBlob,
  putLocalBlob,
} from "@/lib/menu/local-blob-store";

function getPrivateBlobToken(): string | undefined {
  return process.env.MENU_INTAKE_BLOB_READ_WRITE_TOKEN;
}

function assertPrivateBlobConfigured(): void {
  if (process.env.VERCEL) {
    throw new Error("Private menu intake storage is not configured");
  }
}

export async function sanitizeMenuIntakeImage(
  body: Buffer,
  mime: string,
): Promise<Buffer> {
  const image = sharp(body).rotate();
  if (mime === "image/png") return image.png().toBuffer();
  if (mime === "image/webp") return image.webp({ quality: 88 }).toBuffer();
  return image.jpeg({ quality: 88 }).toBuffer();
}

export function buildMenuIntakeBlobPath(
  intakeId: string,
  fileName: string,
): string {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "")
      .toLowerCase() || "bin";
  return `menu-intake/${intakeId}/${Date.now()}-${randomUUID()}.${extension}`;
}

export async function putPrivateMenuIntakeBlob(
  pathname: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const token = getPrivateBlobToken();
  if (!token) {
    assertPrivateBlobConfigured();
    putLocalBlob(pathname, body, contentType);
    return;
  }
  await put(pathname, body, { access: "private", contentType, token });
}

export async function readPrivateMenuIntakeBlob(
  pathname: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const token = getPrivateBlobToken();
  if (!token) {
    assertPrivateBlobConfigured();
    return getLocalBlob(pathname);
  }
  const result = await get(pathname, {
    access: "private",
    token,
    useCache: false,
  });
  if (!result) return null;
  return {
    body: Buffer.from(await new Response(result.stream).arrayBuffer()),
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}

export async function deletePrivateMenuIntakeBlob(
  pathname: string,
): Promise<void> {
  const token = getPrivateBlobToken();
  if (!token) {
    assertPrivateBlobConfigured();
    deleteLocalBlob(pathname);
    return;
  }
  await del(pathname, { token });
}
