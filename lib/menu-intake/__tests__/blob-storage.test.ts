import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const blobMocks = vi.hoisted(() => ({
  del: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@vercel/blob", () => blobMocks);

import { putPrivateMenuIntakeBlob } from "@/lib/menu-intake/blob-storage";

describe("private menu-intake blob storage", () => {
  const originalVercel = process.env.VERCEL;
  const originalPublicToken = process.env.BLOB_READ_WRITE_TOKEN;
  const originalPrivateToken =
    process.env.MENU_INTAKE_BLOB_READ_WRITE_TOKEN;

  beforeEach(() => {
    blobMocks.put.mockReset().mockResolvedValue({
      pathname: "menu-intake/intake-1/photo.jpg",
    });
    process.env.VERCEL = "1";
    process.env.BLOB_READ_WRITE_TOKEN = "public-store-token";
    process.env.MENU_INTAKE_BLOB_READ_WRITE_TOKEN = "private-store-token";
  });

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
    if (originalPublicToken === undefined)
      delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = originalPublicToken;
    if (originalPrivateToken === undefined)
      delete process.env.MENU_INTAKE_BLOB_READ_WRITE_TOKEN;
    else
      process.env.MENU_INTAKE_BLOB_READ_WRITE_TOKEN = originalPrivateToken;
  });

  it("uses the dedicated private token instead of the public menu-media token", async () => {
    await putPrivateMenuIntakeBlob(
      "menu-intake/intake-1/photo.jpg",
      Buffer.from("image"),
      "image/jpeg",
    );

    expect(blobMocks.put).toHaveBeenCalledWith(
      "menu-intake/intake-1/photo.jpg",
      expect.any(Buffer),
      expect.objectContaining({
        access: "private",
        token: "private-store-token",
      }),
    );
  });

  it("refuses to put private files in production without private storage", async () => {
    delete process.env.MENU_INTAKE_BLOB_READ_WRITE_TOKEN;

    await expect(
      putPrivateMenuIntakeBlob(
        "menu-intake/intake-1/photo.jpg",
        Buffer.from("image"),
        "image/jpeg",
      ),
    ).rejects.toThrow("Private menu intake storage is not configured");
    expect(blobMocks.put).not.toHaveBeenCalled();
  });
});
