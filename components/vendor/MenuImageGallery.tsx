"use client";

import { useRef, useState } from "react";
import type { MenuImage } from "@/lib/types";
import { MAX_MENU_IMAGES } from "@/lib/menu/media";
import {
  removeMenuImage,
  reorderMenuImages,
  setPrimaryMenuImage,
  uploadMenuImage,
} from "@/lib/actions/vendor-menu";
import { Button, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface MenuImageGalleryProps {
  vendorSlug: string;
  itemId: string;
  images: MenuImage[];
  ownerToken: string;
  announceChanges: boolean;
  onImagesChange: (images: MenuImage[]) => void;
  onError: (message: string) => void;
  onSaveComplete?: () => void;
  disabled?: boolean;
}

export function MenuImageGallery({
  vendorSlug,
  itemId,
  images,
  ownerToken,
  announceChanges,
  onImagesChange,
  onError,
  onSaveComplete,
  disabled = false,
}: MenuImageGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const sorted = [...images].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime()
  );
  const atLimit = sorted.length >= MAX_MENU_IMAGES;

  const run = async <T,>(action: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    try {
      return await action();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Image action failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    const result = await run(() =>
      uploadMenuImage(ownerToken, vendorSlug, itemId, formData, {
        announce: announceChanges,
      })
    );
    if (!result) return;
    onImagesChange([...sorted, result]);
    onSaveComplete?.();
  };

  const handleSetPrimary = async (imageId: string) => {
    const result = await run(() =>
      setPrimaryMenuImage(ownerToken, vendorSlug, itemId, imageId, {
        announce: announceChanges,
      })
    );
    if (!result) return;
    onImagesChange(
      sorted.map((image) => ({
        ...image,
        isPrimary: image.id === imageId,
      }))
    );
    onSaveComplete?.();
  };

  const handleRemove = async (imageId: string) => {
    const ok = await run(() =>
      removeMenuImage(ownerToken, vendorSlug, itemId, imageId, {
        announce: announceChanges,
      })
    );
    if (!ok) return;
    setConfirmRemoveId(null);
    const remaining = sorted.filter((image) => image.id !== imageId);
    if (remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    onImagesChange(remaining);
    onSaveComplete?.();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const ids = sorted.map((image) => image.id);
    const fromIndex = ids.indexOf(draggingId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, draggingId);
    setDraggingId(null);

    const result = await run(() =>
      reorderMenuImages(ownerToken, vendorSlug, itemId, ids, {
        announce: announceChanges,
      })
    );
    if (result) {
      onImagesChange(result);
      onSaveComplete?.();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-body text-body-sm font-medium text-ink">Photos</p>
        <p className="font-body text-caption text-muted">
          {sorted.length}/{MAX_MENU_IMAGES}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleUpload(file);
        }}
      />

      <div className="grid grid-cols-3 gap-2.5 min-[420px]:grid-cols-4">
        {sorted.map((image) => (
          <div
            key={image.id}
            draggable={!disabled && !busy}
            onDragStart={() => setDraggingId(image.id)}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(image.id)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-brand-md border",
              image.isPrimary ? "border-primary" : "border-hairline",
              draggingId === image.id && "opacity-60"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/55 px-1.5 py-1">
              <button
                type="button"
                aria-label={image.isPrimary ? "Primary photo" : "Set as primary"}
                disabled={disabled || busy || image.isPrimary}
                onClick={() => void handleSetPrimary(image.id)}
                className={cn(
                  "font-body text-caption",
                  image.isPrimary
                    ? "text-primary"
                    : "text-white/80 hover:text-white"
                )}
              >
                {image.isPrimary ? "★" : "☆"}
              </button>
              <button
                type="button"
                aria-label="Remove photo"
                disabled={disabled || busy}
                onClick={() => setConfirmRemoveId(image.id)}
                className="font-body text-caption text-white/90 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {!atLimit ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-brand-md border border-dashed border-hairline-strong text-muted transition-colors hover:border-primary hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-xl leading-none" aria-hidden="true">
              +
            </span>
            <span className="font-body text-caption">
              {busy ? "Uploading…" : "Add photo"}
            </span>
          </button>
        ) : null}
      </div>

      {atLimit ? (
        <p className="font-body text-caption text-muted">
          Maximum {MAX_MENU_IMAGES} photos per item.
        </p>
      ) : null}

      {confirmRemoveId ? (
        <Modal open onClose={() => setConfirmRemoveId(null)} title="Remove photo?">
          <p className="font-body text-body-sm text-muted">
            This cannot be undone. Uploaded files are deleted from storage.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              size="kds"
              className="flex-1"
              disabled={busy}
              onClick={() => void handleRemove(confirmRemoveId)}
            >
              Remove
            </Button>
            <Button
              size="kds"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmRemoveId(null)}
            >
              Cancel
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
