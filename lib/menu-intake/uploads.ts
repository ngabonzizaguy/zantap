export const MENU_INTAKE_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MENU_INTAKE_SOURCE_MIMES = [
  ...MENU_INTAKE_IMAGE_MIMES,
  "application/pdf",
] as const;
export const MAX_INTAKE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_INTAKE_PDF_BYTES = 15 * 1024 * 1024;
export const MAX_INTAKE_SOURCE_FILES = 30;
export const MAX_INTAKE_SOURCE_TOTAL_BYTES = 75 * 1024 * 1024;
export const MAX_DISH_IMAGES = 6;

export function validateMenuIntakeUpload(input: {
  kind: "DISH_IMAGE" | "SOURCE";
  mime: string;
  byteLength: number;
  existingFileCount: number;
  existingTotalBytes: number;
}): string | null {
  const isImage = MENU_INTAKE_IMAGE_MIMES.includes(
    input.mime as (typeof MENU_INTAKE_IMAGE_MIMES)[number],
  );
  if (input.kind === "DISH_IMAGE") {
    if (!isImage) return "Dish photos must be JPEG, PNG, or WebP";
    if (input.existingFileCount >= MAX_DISH_IMAGES)
      return "Maximum 6 photos per dish";
  } else {
    if (
      !MENU_INTAKE_SOURCE_MIMES.includes(
        input.mime as (typeof MENU_INTAKE_SOURCE_MIMES)[number],
      )
    ) {
      return "Source files must be JPEG, PNG, WebP, or PDF";
    }
    if (input.existingFileCount >= MAX_INTAKE_SOURCE_FILES)
      return "Maximum 30 source files";
    if (
      input.existingTotalBytes + input.byteLength >
      MAX_INTAKE_SOURCE_TOTAL_BYTES
    ) {
      return "Source files must total 75 MB or less";
    }
  }
  if (input.byteLength <= 0) return "File is empty";
  const limit =
    input.mime === "application/pdf"
      ? MAX_INTAKE_PDF_BYTES
      : MAX_INTAKE_IMAGE_BYTES;
  if (input.byteLength > limit) {
    return input.mime === "application/pdf"
      ? "PDF must be 15 MB or smaller"
      : "Image must be 5 MB or smaller";
  }
  return null;
}

export function shouldDeleteTerminalSource(
  terminalAt: Date,
  at: Date,
  retainedForDispute = false,
): boolean {
  return (
    !retainedForDispute &&
    at.getTime() - terminalAt.getTime() >= 90 * 24 * 60 * 60_000
  );
}
