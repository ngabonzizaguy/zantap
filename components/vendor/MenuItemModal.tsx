"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { MenuImage, MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { Button, Input, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { MenuImageGallery } from "@/components/vendor/MenuImageGallery";

export interface MenuItemFormValues {
  name: string;
  priceRwf: string;
  description: string;
  category: string;
}

interface MenuItemModalProps {
  open: boolean;
  mode: "create" | "edit";
  item?: MenuItem | null;
  categories: string[];
  saving: boolean;
  serverError: string | null;
  vendorSlug: string;
  writeSecret: string | null;
  onClose: () => void;
  onSubmit: (values: MenuItemFormValues) => void;
  onImagesChange?: (images: MenuImage[]) => void;
}

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

export function MenuItemModal({
  open,
  mode,
  item,
  categories,
  saving,
  serverError,
  vendorSlug,
  writeSecret,
  onClose,
  onSubmit,
  onImagesChange,
}: MenuItemModalProps) {
  const listId = useId();
  const [values, setValues] = useState<MenuItemFormValues>(emptyForm);
  const [clientError, setClientError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<MenuImage[]>([]);

  useEffect(() => {
    if (!open) return;
    setValues(item ? formFromItem(item) : emptyForm());
    setClientError(null);
    setGalleryError(null);
    setGalleryImages(item?.images ?? []);
  }, [open, item]);

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
    onSubmit(values);
  };

  const displayError = clientError ?? serverError ?? galleryError;

  const handleGalleryChange = (images: MenuImage[]) => {
    setGalleryImages(images);
    onImagesChange?.(images);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add menu item" : "Edit menu item"}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={values.name}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, name: event.target.value }))
          }
          disabled={saving}
        />
        <Input
          label="Price (RWF)"
          inputMode="numeric"
          value={values.priceRwf}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, priceRwf: event.target.value }))
          }
          disabled={saving}
        />
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor={`${listId}-description`}
            className="font-body text-body-sm font-medium text-ink"
          >
            Description
          </label>
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
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor={`${listId}-category`}
            className="font-body text-body-sm font-medium text-ink"
          >
            Category
          </label>
          <input
            id={`${listId}-category`}
            list={`${listId}-categories`}
            value={values.category}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, category: event.target.value }))
            }
            disabled={saving}
            className={cn(
              "h-11 min-h-11 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink",
              "placeholder:text-muted-soft focus:border-2 focus:border-ink focus:px-[15px] focus:outline-none"
            )}
            placeholder="General"
          />
          <datalist id={`${listId}-categories`}>
            {suggestions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        {mode === "edit" && item && writeSecret ? (
          <MenuImageGallery
            vendorSlug={vendorSlug}
            itemId={item.id}
            images={galleryImages}
            writeSecret={writeSecret}
            onImagesChange={handleGalleryChange}
            onError={setGalleryError}
            disabled={saving}
          />
        ) : null}
        {displayError ? (
          <p className="font-body text-caption text-error" role="alert">
            {displayError}
          </p>
        ) : null}
        {mode === "edit" && item ? (
          <p className="font-body text-caption text-muted">
            Current price on card: {formatRwf(item.priceRwf)}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="kds"
            className="flex-1"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Saving…" : mode === "create" ? "Create item" : "Save changes"}
          </Button>
          <Button
            size="kds"
            variant="outline"
            className="flex-1"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
