export type MenuIntakeSelectedFile = {
  name: string;
  size: number;
  lastModified: number;
};

export type MenuIntakePendingUpload<TFile extends MenuIntakeSelectedFile = MenuIntakeSelectedFile> = {
  file: TFile;
  kind: "SOURCE" | "DISH_IMAGE";
  dishClientId?: string;
};

export type MenuIntakeConfirmedUpload = {
  attachmentId: string;
  dishClientId?: string;
};

export type MenuIntakeConfirmedUploads = Record<
  string,
  MenuIntakeConfirmedUpload
>;

export type MenuIntakeResumeState = {
  intakeId: string;
  resumeToken: string;
  reference: string;
  pendingUploadKeys?: string[];
  confirmedUploads?: MenuIntakeConfirmedUploads;
};

export function menuIntakeUploadKey(
  upload: MenuIntakePendingUpload,
): string {
  return [
    upload.kind,
    upload.dishClientId || "",
    upload.file.name,
    upload.file.size,
    upload.file.lastModified,
  ].join(":");
}

export async function removeMenuIntakeUpload<
  TFile extends MenuIntakeSelectedFile,
>({
  files,
  fileIndex,
  upload,
  confirmedUploads,
  removeConfirmed,
}: {
  files: readonly TFile[];
  fileIndex: number;
  upload: MenuIntakePendingUpload<TFile>;
  confirmedUploads: MenuIntakeConfirmedUploads;
  removeConfirmed: (attachmentId: string) => Promise<void>;
}): Promise<{
  files: TFile[];
  confirmedUploads: MenuIntakeConfirmedUploads;
}> {
  const key = menuIntakeUploadKey(upload);
  const confirmed = confirmedUploads[key];
  if (confirmed) await removeConfirmed(confirmed.attachmentId);

  const nextConfirmed = { ...confirmedUploads };
  delete nextConfirmed[key];
  return {
    files: files.filter((_, index) => index !== fileIndex),
    confirmedUploads: nextConfirmed,
  };
}

export async function removeMenuIntakeUploads({
  uploads,
  confirmedUploads,
  removeConfirmed,
}: {
  uploads: readonly MenuIntakePendingUpload[];
  confirmedUploads: MenuIntakeConfirmedUploads;
  removeConfirmed: (attachmentId: string) => Promise<void>;
}): Promise<{
  ok: boolean;
  confirmedUploads: MenuIntakeConfirmedUploads;
}> {
  let nextConfirmed = { ...confirmedUploads };
  for (const upload of uploads) {
    const key = menuIntakeUploadKey(upload);
    const confirmed = nextConfirmed[key];
    if (!confirmed) continue;
    try {
      await removeConfirmed(confirmed.attachmentId);
    } catch {
      return { ok: false, confirmedUploads: nextConfirmed };
    }
    const afterRemoval = { ...nextConfirmed };
    delete afterRemoval[key];
    nextConfirmed = afterRemoval;
  }
  return { ok: true, confirmedUploads: nextConfirmed };
}

export function createMenuIntakeResumeState(
  access: Pick<
    MenuIntakeResumeState,
    "intakeId" | "resumeToken" | "reference"
  >,
  uploads: readonly MenuIntakePendingUpload[],
  confirmedUploads: MenuIntakeConfirmedUploads,
): MenuIntakeResumeState {
  const pendingUploadKeys = uploads.map(menuIntakeUploadKey);
  const expectedKeys = new Set(pendingUploadKeys);
  return {
    ...access,
    pendingUploadKeys,
    confirmedUploads: Object.fromEntries(
      Object.entries(confirmedUploads).filter(([key]) => expectedKeys.has(key)),
    ),
  };
}

export function menuIntakeResumeIsComplete(
  resume: MenuIntakeResumeState,
  persistedAttachmentIds: ReadonlySet<string>,
): boolean {
  if (!resume.pendingUploadKeys) return true;
  return resume.pendingUploadKeys.every((key) => {
    const confirmed = resume.confirmedUploads?.[key];
    return Boolean(
      confirmed && persistedAttachmentIds.has(confirmed.attachmentId),
    );
  });
}
