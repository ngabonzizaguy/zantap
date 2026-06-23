"use client";

import { useRef, useState } from "react";
import type { MenuImage } from "@/lib/types";
import { MAX_MENU_IMAGES } from "@/lib/menu/media";
import {
  addMenuImageByUrl,
  removeMenuImage,
  reorderMenuImages,
  setPrimaryMenuImage,
  uploadMenuImage,
} from "@/lib/actions/vendor-menu";
import { Button, Input, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface MenuImageGalleryProps {
  vendorSlug: string;
  itemId: string;
  images: MenuImage[];
  writeSecret: string;
  onImagesChange: (images: MenuImage[]) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function MenuImageGallery({
  vendorSlug,
  itemId,
  images,
  writeSecret,
  onImagesChange,
  onError,
  disabled = false,
}: MenuImageGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
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
      uploadMenuImage(writeSecret, vendorSlug, itemId, formData)
    );
    if (!result) return;
    onImagesChange([...sorted, result]);
  };

  const handleAddUrl = async () => {
    const result = await run(() =>
      addMenuImageByUrl(writeSecret, vendorSlug, itemId, urlInput)
    );
    if (!result) return;
    setUrlInput("");
    onImagesChange([...sorted, result]);
  };

  const handleSetPrimary = async (imageId: string) => {
    const result = await run(() =>
      setPrimaryMenuImage(writeSecret, vendorSlug, itemId, imageId)
    );
    if (!result) return;
    onImagesChange(
      sorted.map((image) => ({
        ...image,
        isPrimary: image.id === imageId,
      }))
    );
  };

  const handleRemove = async (imageId: string) => {
    const ok = await run(() =>
      removeMenuImage(writeSecret, vendorSlug, itemId, imageId)
    );
    if (!ok) return;
    setConfirmRemoveId(null);
    const remaining = sorted.filter((image) => image.id !== imageId);
    if (remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    onImagesChange(remaining);
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
      reorderMenuImages(writeSecret, vendorSlug, itemId, ids)
    );
    if (result) onImagesChange(result);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-body text-body-sm font-medium text-ink">Photos</p>
        <p className="font-body text-caption text-muted">
          {sorted.length}/{MAX_MENU_IMAGES}
        </p>
      </div>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
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
                image.isPrimary ? "border-ink" : "border-hairline",
                draggingId === image.id && "opacity-60"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/55 p-1">
                <button
                  type="button"
                  aria-label={image.isPrimary ? "Primary photo" : "Set as primary"}
                  disabled={disabled || busy || image.isPrimary}
                  onClick={() => void handleSetPrimary(image.id)}
                  className={cn(
                    "rounded-brand-sm px-1.5 py-0.5 font-body text-caption",
                    image.isPrimary
                      ? "text-gradient-mint"
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
                  className="rounded-brand-sm px-1.5 py-0.5 font-body text-caption text-white/90 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-brand-md border border-dashed border-hairline-strong px-3 py-4 text-center font-body text-body-sm text-muted">
          No photos yet — upload or paste a URL.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
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
        <Button
          size="default"
          variant="outline"
          className="flex-1"
          disabled={disabled || busy || atLimit}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload photo
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          label="Image URL"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          disabled={disabled || busy || atLimit}
          placeholder="https://…"
          className="flex-1"
        />
        <Button
          size="default"
          variant="outline"
          disabled={disabled || busy || atLimit || !urlInput.trim()}
          onClick={() => void handleAddUrl()}
        >
          Add URL
        </Button>
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
