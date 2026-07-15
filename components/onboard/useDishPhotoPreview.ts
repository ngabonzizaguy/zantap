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
