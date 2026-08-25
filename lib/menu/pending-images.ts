import { MAX_MENU_IMAGES, validateMenuImageFile } from "@/lib/menu/media";

export interface PendingMenuImageFile {
  size: number;
  type: string;
}

export interface PendingMenuImageSelection<T extends PendingMenuImageFile> {
  files: T[];
  error: string | null;
}

/**
 * Validates create-mode photo drafts and appends as many as fit in the existing
 * six-image gallery limit. The caller keeps the returned order for preview and
 * post-create upload order.
 */
export function mergePendingMenuImageFiles<T extends PendingMenuImageFile>(
  current: readonly T[],
  incoming: readonly T[]
): PendingMenuImageSelection<T> {
  const files = [...current];
  let error: string | null = null;

  for (const file of incoming) {
    const validationError = validateMenuImageFile(file.size, file.type);
    if (validationError) {
      error ??= validationError;
      continue;
    }
    if (files.length >= MAX_MENU_IMAGES) {
      error ??= `You can add up to ${MAX_MENU_IMAGES} photos per item`;
      continue;
    }
    files.push(file);
  }

  return { files, error };
}
