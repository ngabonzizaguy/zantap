import { describe, expect, it, vi } from "vitest";

import {
  createMenuIntakeResumeState,
  menuIntakeResumeIsComplete,
  menuIntakeUploadKey,
  removeMenuIntakeUpload,
  removeMenuIntakeUploads,
} from "@/lib/menu-intake/pending-uploads";

function selectedFile(name: string, size: number, lastModified: number) {
  return { name, size, lastModified };
}

describe("pending Menu Intake uploads", () => {
  it("durably removes a confirmed private file before hiding it from the draft", async () => {
    const photo = selectedFile("dish.jpg", 1200, 10);
    const laterFile = selectedFile("menu.pdf", 2400, 20);
    const upload = { file: photo, kind: "DISH_IMAGE" as const, dishClientId: "dish-1" };
    const key = menuIntakeUploadKey(upload);
    const removeConfirmed = vi.fn(async () => undefined);

    const result = await removeMenuIntakeUpload({
      files: [photo, laterFile],
      fileIndex: 0,
      upload,
      confirmedUploads: {
        [key]: { attachmentId: "attachment-1", dishClientId: "dish-1" },
      },
      removeConfirmed,
    });

    expect(removeConfirmed).toHaveBeenCalledWith("attachment-1");
    expect(result).toEqual({
      files: [laterFile],
      confirmedUploads: {},
    });
  });

  it("does not restore Sent while an expected file is still unconfirmed", () => {
    const photo = { file: selectedFile("dish.jpg", 1200, 10), kind: "DISH_IMAGE" as const, dishClientId: "dish-1" };
    const menu = { file: selectedFile("menu.pdf", 2400, 20), kind: "SOURCE" as const };
    const photoKey = menuIntakeUploadKey(photo);
    const resume = createMenuIntakeResumeState(
      {
        intakeId: "intake-1",
        resumeToken: "resume-token",
        reference: "MI-260830-ABC123",
      },
      [photo, menu],
      {
        [photoKey]: { attachmentId: "attachment-1", dishClientId: "dish-1" },
      },
    );

    expect(
      menuIntakeResumeIsComplete(resume, new Set(["attachment-1"])),
    ).toBe(false);
  });

  it("retains completed cleanup when a later dish photo cannot be removed", async () => {
    const first = { file: selectedFile("first.jpg", 1200, 10), kind: "DISH_IMAGE" as const, dishClientId: "dish-1" };
    const second = { file: selectedFile("second.jpg", 1400, 20), kind: "DISH_IMAGE" as const, dishClientId: "dish-1" };
    const firstKey = menuIntakeUploadKey(first);
    const secondKey = menuIntakeUploadKey(second);
    const removeConfirmed = vi
      .fn<(attachmentId: string) => Promise<void>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("storage unavailable"));

    const result = await removeMenuIntakeUploads({
      uploads: [first, second],
      confirmedUploads: {
        [firstKey]: { attachmentId: "attachment-1", dishClientId: "dish-1" },
        [secondKey]: { attachmentId: "attachment-2", dishClientId: "dish-1" },
      },
      removeConfirmed,
    });

    expect(result).toEqual({
      ok: false,
      confirmedUploads: {
        [secondKey]: { attachmentId: "attachment-2", dishClientId: "dish-1" },
      },
    });
  });
});
