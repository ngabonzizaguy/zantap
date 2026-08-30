import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  put: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/menu-intake/blob-storage", () => ({
  buildMenuIntakeBlobPath: vi.fn(
    () => "menu-intake/intake-1/photo.jpg",
  ),
  deletePrivateMenuIntakeBlob: storageMocks.remove,
  putPrivateMenuIntakeBlob: storageMocks.put,
  sanitizeMenuIntakeImage: vi.fn(async (body: Buffer) => body),
}));

import {
  submitMenuIntake,
  uploadMenuIntakeAttachment,
} from "@/lib/actions/menu-intake-public";
import { createInMemoryStore } from "@/lib/store/in-memory";
import { __resetRateLimits } from "@/lib/vendor/rate-limit";

const globalForStore = globalThis as unknown as {
  __zantapStore?: ReturnType<typeof createInMemoryStore>;
};

describe("uploadMenuIntakeAttachment", () => {
  beforeEach(() => {
    __resetRateLimits();
    globalForStore.__zantapStore = createInMemoryStore();
    storageMocks.put.mockReset();
    storageMocks.remove.mockReset();
  });

  it("returns a recoverable message when private storage rejects the upload", async () => {
    storageMocks.put.mockRejectedValueOnce(
      new Error("Private menu intake storage is not configured"),
    );
    const submitted = await submitMenuIntake({
      businessName: "Kigali Kitchen",
      contactName: "Aline",
      phone: "0781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "dish-1",
            name: "Isombe",
            category: "Main dishes",
            priceRwf: 3500,
          },
        ],
      },
    });
    if (!submitted.ok) throw new Error("Expected initial submission");

    const formData = new FormData();
    formData.set("intakeId", submitted.intakeId);
    formData.set("resumeToken", submitted.resumeToken);
    formData.set("kind", "DISH_IMAGE");
    formData.set("dishClientId", "dish-1");
    formData.set(
      "file",
      new File(["image"], "photo.jpg", { type: "image/jpeg" }),
    );

    await expect(uploadMenuIntakeAttachment(formData)).resolves.toEqual({
      ok: false,
      error: "UPLOAD_FAILED",
      message:
        "Your menu was saved, but this photo did not upload. Please tap Send menu again.",
    });
  });
});
