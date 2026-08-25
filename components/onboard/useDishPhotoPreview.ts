"use client";

import { useEffect, useState } from "react";

/** Object URL for a wizard-selected dish photo; revokes on change/unmount. */
export function useDishPhotoPreview(file: File | null): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- object-URL lifecycle is an external system; create/revoke must pair with render commits
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return previewUrl;
}

/** Object URLs for a staged gallery; preserves file order and revokes on change/unmount. */
export function useDishPhotoPreviews(files: readonly File[]): string[] {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object-URL lifecycle is an external system; create/revoke must pair with render commits
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  return previewUrls;
}
