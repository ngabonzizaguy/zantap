"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { MenuImage, MenuItem, MenuItemAddOnGroup } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getPrimaryImageUrl, MAX_MENU_IMAGES } from "@/lib/menu/media";
import { mergePendingMenuImageFiles } from "@/lib/menu/pending-images";
import {
  getMenuItemSizeOptions,
  getMenuItemStartingPrice,
} from "@/lib/menu/sizes";
import { parseSizePriceDraft } from "@/lib/menu/size-price-draft";
import { validateCreateMenuItemInput } from "@/lib/menu/validation";
import { useDishPhotoPreviews } from "@/components/onboard/useDishPhotoPreview";
import { Badge, Button, Combobox, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { MenuImageGallery } from "@/components/vendor/MenuImageGallery";
import {
  parsePriceDraft,
  SizePricingEditor,
  type SizeOptionDraft,
} from "@/components/vendor/SizePricingEditor";
import { AddOnGroupsEditor } from "@/components/vendor/AddOnGroupsEditor";

export interface MenuItemFormValues {
  name: string;
  priceRwf: string;
  useSizes: boolean;
  sizeOptions: SizeOptionDraft[];
  description: string;
  category: string;
  addOnGroups: MenuItemAddOnGroup[];
}

export interface MenuItemSubmitOptions {
  /** Ordered photos to upload after create (create mode only). */
  pendingPhotos?: File[];
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
  onToggleAvailability?: () => void;
}

const NAME_MAX = 60;
const COMING_SOON_SECTIONS = ["Ingredients", "Options"] as const;
const fieldLabelClass = "font-body text-body-sm font-medium text-ink";
const fieldControlClass =
  "h-11 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-2 focus:border-primary focus:px-[15px] focus:outline-none";

function emptyForm(): MenuItemFormValues {
  return {
    name: "",
    priceRwf: "",
    useSizes: false,
    sizeOptions: [],
    description: "",
    category: "General",
    addOnGroups: [],
  };
}

function formFromItem(item: MenuItem): MenuItemFormValues {
  return {
    name: item.name,
    priceRwf: item.priceRwf.toLocaleString("en-US"),
    useSizes: Boolean(item.sizeOptions?.length),
    sizeOptions:
      item.sizeOptions?.map((option) => ({
        ...option,
        priceRwf: option.priceRwf.toLocaleString("en-US"),
      })) ?? [],
    description: item.description ?? "",
    category: item.category,
    addOnGroups: item.addOnGroups?.map((group) => ({ ...group, choices: group.choices.map((choice) => ({ ...choice })) })) ?? [],
  };
}

function formSizeOptions(values: MenuItemFormValues) {
  return values.useSizes
    ? values.sizeOptions.map((option) => ({
        ...option,
        priceRwf: parseSizePriceDraft(option.priceRwf),
      }))
    : undefined;
}

function validateClient(values: MenuItemFormValues): string | null {
  const sizeOptions = formSizeOptions(values);
  return validateCreateMenuItemInput({
    name: values.name,
    priceRwf: sizeOptions?.[0]?.priceRwf ?? parsePriceDraft(values.priceRwf),
    sizeOptions,
    description: values.description,
    category: values.category,
    addOnGroups: values.addOnGroups,
  });
}

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
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [previewSizesOpen, setPreviewSizesOpen] = useState(false);
  const [addOnsOpen, setAddOnsOpen] = useState(false);
  const pendingPhotoPreviews = useDishPhotoPreviews(pendingPhotos);

  const editingItemId = item?.id;
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
      setPendingPhotos([]);
      setDescriptionOpen(Boolean(item?.description));
      setPreviewSizesOpen(false);
      setAddOnsOpen(false);
    }
  }

  const suggestions = useMemo(() => {
    const base = new Set(categories.filter((category) => category && category !== "All"));
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
      pendingPhotos: mode === "create" ? pendingPhotos : [],
    });
  };

  const handlePendingPhotos = (files: readonly File[]) => {
    const next = mergePendingMenuImageFiles(pendingPhotos, files);
    setPendingPhotos(next.files);
    setGalleryError(next.error);
  };

  const handleGalleryChange = (images: MenuImage[]) => {
    setGalleryImages(images);
    onImagesChange?.(images);
  };

  const previewImage = item ? getPrimaryImageUrl(item) : null;
  const previewBg = item
    ? `radial-gradient(circle at 32% 28%, ${item.thumbFrom ?? "#ffd2b0"}, ${item.thumbTo ?? "#f5945f"})`
    : undefined;
  const available = item?.isAvailable ?? true;
  const previewSizes = item ? getMenuItemSizeOptions(item) : [];
  const displayError = clientError ?? serverError ?? galleryError;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add menu item" : "Edit menu item"}
      footer={addOnsOpen ? (
        <div className="flex gap-2">
          <Button size="kds" variant="outline" className="flex-1" disabled={saving} onClick={() => setAddOnsOpen(false)}>
            Back to item
          </Button>
          <Button size="kds" className="flex-1" disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving…" : mode === "create" ? "Create item" : "Save add-ons"}
          </Button>
        </div>
      ) :
        <div className="flex gap-2">
          <Button size="kds" variant="outline" className="flex-1" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button size="kds" className="flex-1" disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving…" : mode === "create" ? "Create item" : "Save changes"}
          </Button>
        </div>
      }
    >
      {addOnsOpen ? (
        <div className="space-y-4">
          <AddOnGroupsEditor groups={values.addOnGroups} disabled={saving} onChange={(addOnGroups) => setValues((previous) => ({ ...previous, addOnGroups }))} />
          <p className="font-body text-caption text-muted">
            Save add-ons to update this menu item.
          </p>
          {displayError ? <p className="font-body text-caption text-error" role="alert">{displayError}</p> : null}
        </div>
      ) : <div className="flex flex-col gap-5">
        {mode === "edit" && item ? (
          <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-3.5">
            <div
              className="relative h-16 w-16 flex-none overflow-hidden rounded-brand-md"
              style={previewImage ? undefined : { background: previewBg }}
            >
              {previewImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-body-md font-semibold text-ink">{item.name}</p>
              <Badge className="mt-1">{item.category}</Badge>
              {previewSizes.length > 0 ? (
                <button
                  type="button"
                  disabled={saving}
                  aria-expanded={previewSizesOpen}
                  aria-controls={`${listId}-size-summary`}
                  onClick={() => setPreviewSizesOpen((current) => !current)}
                  className="mt-1.5 flex min-h-8 max-w-full items-center gap-1.5 rounded-brand-sm pr-1 text-left font-body text-caption font-medium text-primary transition-colors hover:text-ink"
                >
                  <span className="truncate">
                    {previewSizes.length} sizes · From {formatRwf(getMenuItemStartingPrice(item))}
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.8}
                    className={cn(
                      "flex-none transition-transform duration-200",
                      previewSizesOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
              ) : (
                <p className="mt-1 font-body text-caption font-medium text-primary">
                  {formatRwf(item.priceRwf)}
                </p>
              )}
            </div>

            {previewSizes.length > 0 && previewSizesOpen ? (
              <div
                id={`${listId}-size-summary`}
                className="col-span-2 mt-3 overflow-hidden rounded-brand-md border border-hairline bg-canvas-soft"
              >
                {previewSizes.map((option) => (
                  <div
                    key={option.id}
                    className="flex min-h-10 items-center justify-between gap-3 border-b border-hairline px-3 py-2 last:border-b-0"
                  >
                    <span className="min-w-0 truncate font-body text-caption text-ink">
                      {option.label}
                    </span>
                    <span className={cn(
                      "flex-none font-mono text-caption font-medium",
                      option.isAvailable ? "text-primary" : "text-muted"
                    )}>
                      {formatRwf(option.priceRwf)}
                      {!option.isAvailable ? " · Hidden" : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor={`${listId}-name`} className={fieldLabelClass}>Dish name</label>
          <div className="relative">
            <input
              id={`${listId}-name`}
              value={values.name}
              maxLength={NAME_MAX}
              onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
              disabled={saving}
              placeholder="e.g. Roasted Chicken Feast"
              className={cn(fieldControlClass, "pr-16")}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-body text-caption text-muted-soft">
              {values.name.length}/{NAME_MAX}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-4",
            mode === "create"
              ? "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]"
              : "grid-cols-1",
          )}
        >
          <Combobox
            id={`${listId}-category`}
            label="Category"
            value={values.category}
            onChange={(category) => setValues((previous) => ({ ...previous, category }))}
            suggestions={suggestions}
            disabled={saving}
            placeholder="General"
          />

          {mode === "create" ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className={fieldLabelClass}>Photos</p>
                <p className="font-body text-caption text-muted">
                  {pendingPhotos.length}/{MAX_MENU_IMAGES}
                </p>
              </div>
              <input
                ref={createPhotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  handlePendingPhotos(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
              <div className="mt-1.5 grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:grid-cols-3">
                {pendingPhotos.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-brand-md border bg-canvas-soft",
                      index === 0 ? "border-primary" : "border-hairline"
                    )}
                  >
                    {pendingPhotoPreviews[index] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={pendingPhotoPreviews[index]}
                        alt={`Selected photo ${index + 1}: ${file.name}`}
                        className="h-full w-full object-cover object-center"
                        draggable={false}
                      />
                    ) : null}
                    {index === 0 ? (
                      <span className="absolute bottom-1 left-1 rounded-pill bg-ink/70 px-1.5 py-0.5 font-body text-[10px] font-medium text-white">
                        Cover
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      disabled={saving}
                      onClick={() => {
                        setPendingPhotos((current) =>
                          current.filter((_, photoIndex) => photoIndex !== index)
                        );
                        setGalleryError(null);
                      }}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/75 text-white transition-colors hover:bg-ink disabled:opacity-50"
                    >
                      <X size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                ))}

                {pendingPhotos.length < MAX_MENU_IMAGES ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => createPhotoInputRef.current?.click()}
                    className="flex aspect-square min-h-16 flex-col items-center justify-center gap-1 rounded-brand-md border border-dashed border-hairline-strong font-body text-caption text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <Plus size={18} strokeWidth={1.8} aria-hidden />
                    {pendingPhotos.length ? "Add more" : "Add photos"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <SizePricingEditor
          idPrefix={listId}
          useSizes={values.useSizes}
          singlePriceRwf={values.priceRwf}
          sizeOptions={values.sizeOptions}
          disabled={saving}
          onUseSizesChange={(useSizes) => setValues((previous) => ({ ...previous, useSizes }))}
          onSinglePriceChange={(priceRwf) => setValues((previous) => ({ ...previous, priceRwf }))}
          onSizeOptionsChange={(sizeOptions) => setValues((previous) => ({ ...previous, sizeOptions }))}
        />

        {mode === "edit" && item && onToggleAvailability ? (
          <div className="flex items-start justify-between gap-3 rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
            <div className="min-w-0">
              <p className={fieldLabelClass}>Status</p>
              <p className={cn("mt-1 flex items-center gap-1.5 font-body text-body-sm font-medium", available ? "text-success" : "text-error")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", available ? "bg-success" : "bg-error")} />
                {available ? "Available" : "Sold out"}
              </p>
              <p className="mt-0.5 font-body text-caption text-muted">
                {available ? "This item is visible on your storefront" : "Customers cannot order this item right now"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={available}
              aria-label={`Toggle ${item.name} availability`}
              disabled={saving}
              onClick={onToggleAvailability}
              className={cn("relative mt-0.5 h-7 w-12 flex-none rounded-pill transition-colors", available ? "bg-success" : "bg-muted-soft")}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-surface-card transition-all", available ? "left-6" : "left-1")} />
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

        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-brand-lg border border-hairline bg-surface-card">
            <button
              type="button"
              onClick={() => setDescriptionOpen((previous) => !previous)}
              aria-expanded={descriptionOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="font-body text-body-md font-medium text-ink">Description</span>
              <span className="flex items-center gap-2 font-body text-caption text-muted">
                {values.description.trim() ? "Added" : "Optional"}
                <span className={cn("transition-transform", descriptionOpen && "rotate-90")}>›</span>
              </span>
            </button>
            {descriptionOpen ? (
              <div className="border-t border-hairline px-4 py-3">
                <textarea
                  id={`${listId}-description`}
                  rows={3}
                  value={values.description}
                  onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))}
                  disabled={saving}
                  className="w-full resize-none rounded-brand-md border border-hairline-strong bg-surface-card px-4 py-3 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-2 focus:border-primary focus:px-[15px] focus:outline-none"
                  placeholder="Optional — ingredients, portion size…"
                />
              </div>
            ) : null}
          </div>

          <button type="button" onClick={() => setAddOnsOpen(true)} className="flex min-h-14 items-center justify-between gap-3 rounded-brand-lg border border-hairline bg-surface-card px-4 py-3 text-left">
            <span><span className="block font-body text-body-md font-medium text-ink">Add-ons</span><span className="mt-0.5 block font-body text-caption text-muted">{values.addOnGroups.length ? `${values.addOnGroups.length} configured` : "Optional groups and choices"}</span></span>
            <ChevronDown className="-rotate-90 text-muted" size={18} />
          </button>
          {COMING_SOON_SECTIONS.map((section) => (
            <div key={section} className="flex items-center justify-between gap-3 rounded-brand-lg border border-hairline bg-surface-card px-4 py-3 opacity-60">
              <span className="font-body text-body-md font-medium text-ink">{section}</span>
              <Badge variant="muted">Soon</Badge>
            </div>
          ))}
        </div>

        {displayError ? <p className="font-body text-caption text-error" role="alert">{displayError}</p> : null}
      </div>}
    </Modal>
  );
}
