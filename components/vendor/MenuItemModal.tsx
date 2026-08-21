"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { MenuImage, MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getPrimaryImageUrl } from "@/lib/menu/media";
import { useDishPhotoPreview } from "@/components/onboard/useDishPhotoPreview";
import { Badge, Button, Combobox, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { MenuImageGallery } from "@/components/vendor/MenuImageGallery";

export interface MenuItemFormValues {
  name: string;
  priceRwf: string;
  description: string;
  category: string;
}

export interface MenuItemSubmitOptions {
  /** First photo to upload after create (create mode only). */
  pendingPhoto?: File | null;
}

interface MenuItemModalProps {
  open: boolean;
  mode: "create" | "edit";
  item?: MenuItem | null;
  categories: string[];
  saving: boolean;
  serverError: string | null;
  vendorSlug: string;
  ownerToken: string | null;
  announceChanges: boolean;
  onClose: () => void;
  onSubmit: (values: MenuItemFormValues, options?: MenuItemSubmitOptions) => void;
  onImagesChange?: (images: MenuImage[]) => void;
  onImageSaveComplete?: () => void;
  /** Availability toggle for the item being edited (edit mode only). */
  onToggleAvailability?: () => void;
}

const NAME_MAX = 60;

function emptyForm(): MenuItemFormValues {
  return { name: "", priceRwf: "", description: "", category: "General" };
}

function formFromItem(item: MenuItem): MenuItemFormValues {
  return {
    name: item.name,
    priceRwf: String(item.priceRwf),
    description: item.description ?? "",
    category: item.category,
  };
}

function validateClient(values: MenuItemFormValues): string | null {
  if (!values.name.trim()) return "Name is required";
  const price = Number(values.priceRwf);
  if (!Number.isInteger(price) || price <= 0) {
    return "Price must be a positive whole number (RWF)";
  }
  return null;
}

const fieldLabelClass = "font-body text-body-sm font-medium text-ink";
const fieldControlClass =
  "h-11 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-2 focus:border-ink focus:px-[15px] focus:outline-none";

/** Deferred sections shown in the mockup that have no schema yet. */
const COMING_SOON_SECTIONS = ["Ingredients", "Add-ons", "Options"] as const;

export function MenuItemModal({
  open,
  mode,
  item,
  categories,
  saving,
  serverError,
  vendorSlug,
  ownerToken,
  announceChanges,
  onClose,
  onSubmit,
  onImagesChange,
  onImageSaveComplete,
  onToggleAvailability,
}: MenuItemModalProps) {
  const listId = useId();
  const createPhotoInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<MenuItemFormValues>(emptyForm);
  const [clientError, setClientError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<MenuImage[]>([]);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const pendingPhotoPreview = useDishPhotoPreview(pendingPhoto);

  const editingItemId = item?.id;

  // Reset only when the dialog opens or a different item is selected — not when
  // the parent passes a fresh object reference (SSE refresh, gallery upload).
  // "Adjust state during render": keyed on (open, itemId, mode), reads latest item.
  const [prevFormKey, setPrevFormKey] = useState({ open, editingItemId, mode });
  if (
    prevFormKey.open !== open ||
    prevFormKey.editingItemId !== editingItemId ||
    prevFormKey.mode !== mode
  ) {
    setPrevFormKey({ open, editingItemId, mode });
    if (open) {
      setValues(item ? formFromItem(item) : emptyForm());
      setClientError(null);
      setGalleryError(null);
      setGalleryImages(item?.images ?? []);
      setPendingPhoto(null);
      setDescriptionOpen(Boolean(item?.description));
    }
  }

  const suggestions = useMemo(() => {
    const base = new Set(categories.filter((c) => c && c !== "All"));
    base.add("General");
    if (values.category.trim()) base.add(values.category.trim());
    return [...base].sort((a, b) => a.localeCompare(b));
  }, [categories, values.category]);

  const handleSubmit = () => {
    const error = validateClient(values);
    if (error) {
      setClientError(error);
      return;
    }
    setClientError(null);
    onSubmit(values, {
      pendingPhoto: mode === "create" ? pendingPhoto : null,
    });
  };

  const displayError = clientError ?? serverError ?? galleryError;

  const handleGalleryChange = (images: MenuImage[]) => {
    setGalleryImages(images);
    onImagesChange?.(images);
  };

  const previewImage = item ? getPrimaryImageUrl(item) : null;
  const previewBg = item
    ? `radial-gradient(circle at 32% 28%, ${item.thumbFrom ?? "#ffd2b0"}, ${item.thumbTo ?? "#f5945f"})`
    : undefined;
  const available = item?.isAvailable ?? true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add menu item" : "Edit menu item"}
      footer={
        <div className="flex gap-2">
          <Button
            size="kds"
            variant="outline"
            className="flex-1"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="kds"
            className="flex-1"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Saving…" : mode === "create" ? "Create item" : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {mode === "edit" && item ? (
          <div className="flex items-center gap-3.5">
            <div
              className="relative h-16 w-16 flex-none overflow-hidden rounded-brand-md"
              style={previewImage ? undefined : { background: previewBg }}
            >
              {previewImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  draggable={false}
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate font-body text-body-md font-semibold text-ink">
                {item.name}
              </p>
              <Badge className="mt-1">{item.category}</Badge>
              <p className="mt-1 font-body text-body-sm font-semibold text-primary">
                {formatRwf(item.priceRwf)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor={`${listId}-name`} className={fieldLabelClass}>
            Dish name
          </label>
          <div className="relative">
            <input
              id={`${listId}-name`}
              value={values.name}
              maxLength={NAME_MAX}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              disabled={saving}
              placeholder="e.g. Prime Ribeye Steak"
              className={cn(fieldControlClass, "pr-16")}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-body text-caption text-muted-soft"
            >
              {values.name.length}/{NAME_MAX}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-[1.4fr_1fr]">
          <Combobox
            id={`${listId}-category`}
            label="Category"
            value={values.category}
            onChange={(category) =>
              setValues((prev) => ({ ...prev, category }))
            }
            suggestions={suggestions}
            disabled={saving}
            placeholder="General"
          />
          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor={`${listId}-price`} className={fieldLabelClass}>
              Price (RWF)
            </label>
            <input
              id={`${listId}-price`}
              inputMode="numeric"
              value={values.priceRwf}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, priceRwf: event.target.value }))
              }
              disabled={saving}
              placeholder="5,000"
              className={fieldControlClass}
            />
          </div>
        </div>

        {mode === "edit" && item && onToggleAvailability ? (
          <div className="flex items-start justify-between gap-3 rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
            <div className="min-w-0">
              <p className={fieldLabelClass}>Status</p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1.5 font-body text-body-sm font-medium",
                  available ? "text-success" : "text-error"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    available ? "bg-success" : "bg-error"
                  )}
                />
                {available ? "Available" : "Sold out"}
              </p>
              <p className="mt-0.5 font-body text-caption text-muted">
                {available
                  ? "This item is visible on your storefront"
                  : "Customers cannot order this item right now"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={available}
              aria-label={`Toggle ${item.name} availability`}
              disabled={saving}
              onClick={onToggleAvailability}
              className={cn(
                "relative mt-0.5 h-7 w-12 flex-none rounded-pill transition-colors",
                available ? "bg-success" : "bg-muted-soft"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-surface-card shadow-brand-soft transition-all",
                  available ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        ) : null}

        {mode === "edit" && item && ownerToken ? (
          <MenuImageGallery
            vendorSlug={vendorSlug}
            itemId={item.id}
            images={galleryImages}
            ownerToken={ownerToken}
            announceChanges={announceChanges}
            onImagesChange={handleGalleryChange}
            onSaveComplete={onImageSaveComplete}
            onError={setGalleryError}
            disabled={saving}
          />
        ) : null}

        {mode === "create" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-body-sm font-medium text-ink">Photos</p>
              <p className="font-body text-caption text-muted">
                {pendingPhoto ? "1/6" : "0/6"}
              </p>
            </div>
            <input
              ref={createPhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                setPendingPhoto(file);
              }}
            />
            <div className="grid grid-cols-3 gap-2.5 min-[420px]:grid-cols-4">
              {pendingPhotoPreview ? (
                <div className="relative aspect-square overflow-hidden rounded-brand-md border border-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingPhotoPreview}
                    alt=""
                    className="h-full w-full object-cover object-center"
                    draggable={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-end bg-ink/55 px-1.5 py-1">
                    <button
                      type="button"
                      aria-label="Remove photo"
                      disabled={saving}
                      onClick={() => setPendingPhoto(null)}
                      className="font-body text-caption text-white/90 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : null}
              {!pendingPhoto ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => createPhotoInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-brand-md border border-dashed border-hairline-strong text-muted transition-colors hover:border-primary hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    +
                  </span>
                  <span className="font-body text-caption">Add photo</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-brand-lg border border-hairline bg-surface-card">
            <button
              type="button"
              onClick={() => setDescriptionOpen((prev) => !prev)}
              aria-expanded={descriptionOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="font-body text-body-md font-medium text-ink">
                Description
              </span>
              <span className="flex items-center gap-2 font-body text-caption text-muted">
                {values.description.trim() ? "Added" : "Optional"}
                <span
                  aria-hidden="true"
                  className={cn(
                    "transition-transform",
                    descriptionOpen && "rotate-90"
                  )}
                >
                  ›
                </span>
              </span>
            </button>
            {descriptionOpen ? (
              <div className="border-t border-hairline px-4 py-3">
                <textarea
                  id={`${listId}-description`}
                  rows={3}
                  value={values.description}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  disabled={saving}
                  className={cn(
                    "w-full resize-none rounded-brand-md border border-hairline-strong bg-surface-card px-4 py-3 font-body text-body-md text-ink",
                    "placeholder:text-muted-soft focus:border-2 focus:border-ink focus:px-[15px] focus:outline-none"
                  )}
                  placeholder="Optional — ingredients, portion size…"
                />
              </div>
            ) : null}
          </div>

          {COMING_SOON_SECTIONS.map((section) => (
            <div
              key={section}
              className="flex items-center justify-between gap-3 rounded-brand-lg border border-hairline bg-surface-card px-4 py-3 opacity-60"
            >
              <span className="font-body text-body-md font-medium text-ink">
                {section}
              </span>
              <span className="flex items-center gap-2 font-body text-caption text-muted">
                <Badge variant="muted">Soon</Badge>
              </span>
            </div>
          ))}
        </div>

        {displayError ? (
          <p className="font-body text-caption text-error" role="alert">
            {displayError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
