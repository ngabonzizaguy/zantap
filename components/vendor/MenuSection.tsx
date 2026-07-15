"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getPrimaryImageUrl } from "@/lib/menu/media";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import {
  archiveMenuItem,
  createMenuItem,
  loadArchivedMenu,
  loadMenuCategories,
  restoreMenuItem,
  updateMenuItem,
  uploadMenuImage,
} from "@/lib/actions/vendor-menu";
import { Badge, Button, Card, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { MenuItemModal, type MenuItemFormValues, type MenuItemSubmitOptions } from "@/components/vendor/MenuItemModal";

type MenuFilter = "active" | "archived";

// Owner token is auto-issued at provision and cached by slug — it is never
// typed here. When it is absent (new device / cleared storage) we point the
// vendor at Setup rather than prompting (ADR-0022; recovery UI lands in Issue 3).
const NO_TOKEN_MESSAGE =
  "Owner access required — add your owner token in the Setup guide.";

interface RowAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  /** Renders a mini availability switch on the right (toggle row). */
  switchOn?: boolean;
  onSelect: () => void;
}

interface RowMenuProps {
  itemName: string;
  actions: RowAction[];
}

function RowMenu({ itemName, actions }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-none">
      <button
        type="button"
        aria-label={`Actions for ${itemName}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-brand-md text-muted transition-colors hover:bg-surface-strong hover:text-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-brand-lg border border-hairline bg-surface-card py-1 shadow-brand-soft">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left font-body text-body-sm transition-colors hover:bg-surface-strong",
                action.danger ? "text-error" : "text-ink"
              )}
            >
              <span className="flex-none text-muted" aria-hidden="true">
                {action.icon}
              </span>
              <span className="flex-1">{action.label}</span>
              {action.switchOn !== undefined ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative h-5 w-9 flex-none rounded-pill transition-colors",
                    action.switchOn ? "bg-success" : "bg-muted-soft"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-surface-card transition-all",
                      action.switchOn ? "left-[18px]" : "left-0.5"
                    )}
                  />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const iconStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const editIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" {...iconStroke} aria-hidden="true">
    <path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" />
  </svg>
);

const duplicateIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" {...iconStroke} aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const toggleIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" {...iconStroke} aria-hidden="true">
    <rect x="2" y="7" width="20" height="10" rx="5" />
    <circle cx="16" cy="12" r="2.6" />
  </svg>
);

const archiveIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" {...iconStroke} aria-hidden="true">
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);

const restoreIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" {...iconStroke} aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

interface MenuRowProps {
  item: MenuItem;
  archived?: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

function MenuRow({
  item,
  archived = false,
  onEdit,
  onDuplicate,
  onToggle,
  onArchive,
  onRestore,
}: MenuRowProps) {
  const thumbBg = `radial-gradient(circle at 32% 28%, ${item.thumbFrom ?? "#ffd2b0"}, ${item.thumbTo ?? "#f5945f"})`;
  const primaryImage = getPrimaryImageUrl(item);
  const available = item.isAvailable;

  const actions: RowAction[] = archived
    ? [
        {
          key: "restore",
          label: "Restore item",
          icon: restoreIcon,
          onSelect: onRestore,
        },
      ]
    : [
        { key: "edit", label: "Edit item", icon: editIcon, onSelect: onEdit },
        {
          key: "duplicate",
          label: "Duplicate",
          icon: duplicateIcon,
          onSelect: onDuplicate,
        },
        {
          key: "toggle",
          label: "Toggle availability",
          icon: toggleIcon,
          switchOn: available,
          onSelect: onToggle,
        },
        {
          key: "archive",
          label: "Archive item",
          icon: archiveIcon,
          danger: true,
          onSelect: onArchive,
        },
      ];

  return (
    <div className="flex items-center gap-3 rounded-brand-lg border border-hairline bg-surface-card p-3">
      <button
        type="button"
        onClick={archived ? undefined : onEdit}
        disabled={archived}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 text-left",
          archived ? "cursor-default opacity-70" : "cursor-pointer"
        )}
      >
        <div
          className="relative h-14 w-14 flex-none overflow-hidden rounded-brand-md"
          style={primaryImage ? undefined : { background: thumbBg }}
        >
          {primaryImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={primaryImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              draggable={false}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-body-md font-semibold text-ink">
            {item.name}
          </p>
          <p className="font-body text-body-sm font-semibold text-primary">
            {formatRwf(item.priceRwf)}
          </p>
          <Badge variant={archived ? "muted" : "default"} className="mt-1">
            {item.category}
          </Badge>
        </div>
      </button>

      <span
        className={cn(
          "hidden flex-none items-center gap-1.5 rounded-pill border px-3 py-1 font-body text-caption font-medium min-[420px]:inline-flex",
          archived
            ? "border-hairline text-muted"
            : available
              ? "border-success/40 text-success"
              : "border-error/40 text-error"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            archived ? "bg-muted-soft" : available ? "bg-success" : "bg-error"
          )}
        />
        {archived ? "Archived" : available ? "Available" : "Sold out"}
      </span>

      <RowMenu itemName={item.name} actions={actions} />
    </div>
  );
}

interface MenuSectionProps {
  vendorSlug: string;
  items: MenuItem[];
  onToggle: (id: string) => void;
  onResetAll: () => void;
  onRefresh: () => Promise<void>;
}

export function MenuSection({
  vendorSlug,
  items,
  onToggle,
  onResetAll,
  onRefresh,
}: MenuSectionProps) {
  const { token, hasToken, ready } = useOwnerToken(vendorSlug);
  const [filter, setFilter] = useState<MenuFilter>("active");
  const [archivedItems, setArchivedItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const next = await loadMenuCategories(vendorSlug);
    setCategories(next);
  }, [vendorSlug]);

  const loadArchived = useCallback(async () => {
    const next = await loadArchivedMenu(vendorSlug);
    setArchivedItems(next);
  }, [vendorSlug]);

  useEffect(() => {
    void loadMenuCategories(vendorSlug).then(setCategories);
  }, [vendorSlug]);

  useEffect(() => {
    if (filter === "archived") {
      void loadArchivedMenu(vendorSlug).then(setArchivedItems);
    }
  }, [filter, vendorSlug]);

  const requireToken = useCallback(
    (action: () => void) => {
      if (!hasToken) {
        setActionError(NO_TOKEN_MESSAGE);
        return;
      }
      setActionError(null);
      action();
    },
    [hasToken]
  );

  const parseActionError = (error: unknown): string => {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    if (message.toLowerCase().includes("owner token")) {
      return NO_TOKEN_MESSAGE;
    }
    return message;
  };

  const runGuarded = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    if (!token) {
      setActionError(NO_TOKEN_MESSAGE);
      return null;
    }
    try {
      return await fn();
    } catch (error) {
      setActionError(parseActionError(error));
      return null;
    }
  };

  const openCreate = () => {
    setEditorMode("create");
    setEditingItem(null);
    setActionError(null);
    requireToken(() => setEditorOpen(true));
  };

  const openEdit = (item: MenuItem) => {
    setEditorMode("edit");
    setEditingItem(item);
    setActionError(null);
    requireToken(() => setEditorOpen(true));
  };

  const handleSubmit = async (
    values: MenuItemFormValues,
    options?: MenuItemSubmitOptions
  ) => {
    if (!token) return;
    setSaving(true);
    setActionError(null);
    const priceRwf = Number(values.priceRwf);
    const payload = {
      name: values.name,
      priceRwf,
      description: values.description || undefined,
      category: values.category || "General",
    };

    let result: MenuItem | null = null;

    if (editorMode === "create") {
      result = await runGuarded(() => createMenuItem(token, vendorSlug, payload));
      if (result && options?.pendingPhoto) {
        const formData = new FormData();
        formData.set("file", options.pendingPhoto);
        await runGuarded(() =>
          uploadMenuImage(token, vendorSlug, result!.id, formData)
        );
      }
    } else if (editingItem) {
      result = await runGuarded(() =>
        updateMenuItem(token, vendorSlug, editingItem.id, payload)
      );
    }

    setSaving(false);
    if (result === null) return;

    setEditorOpen(false);
    await onRefresh();
    await loadCategories();
    if (filter === "archived") await loadArchived();
  };

  const handleDuplicate = async (item: MenuItem) => {
    if (!token) {
      setActionError(NO_TOKEN_MESSAGE);
      return;
    }
    setSaving(true);
    setActionError(null);
    const result = await runGuarded(() =>
      createMenuItem(token, vendorSlug, {
        name: `${item.name} (copy)`.slice(0, 60),
        priceRwf: item.priceRwf,
        description: item.description,
        category: item.category,
      })
    );
    setSaving(false);
    if (result) {
      await onRefresh();
      await loadCategories();
    }
  };

  const handleArchive = async (itemId: string) => {
    if (!token) return;
    setSaving(true);
    setActionError(null);
    const result = await runGuarded(() =>
      archiveMenuItem(token, vendorSlug, itemId)
    );
    setSaving(false);
    setConfirmArchiveId(null);
    if (result) {
      await onRefresh();
      await loadArchived();
    }
  };

  const handleRestore = async (itemId: string) => {
    if (!token) return;
    setSaving(true);
    setActionError(null);
    const result = await runGuarded(() =>
      restoreMenuItem(token, vendorSlug, itemId)
    );
    setSaving(false);
    if (result) {
      await onRefresh();
      await loadArchived();
    }
  };

  const handleModalToggle = () => {
    if (!editingItem) return;
    onToggle(editingItem.id);
    setEditingItem((prev) =>
      prev ? { ...prev, isAvailable: !prev.isAvailable } : prev
    );
  };

  const visibleItems = filter === "active" ? items : archivedItems;
  const availCount = items.filter((item) => item.isAvailable).length;

  return (
    <div className="rounded-brand-xl border border-hairline bg-surface-card/80 p-4 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-body text-caption-uppercase uppercase tracking-wide text-muted">
            Menu
          </p>
          <h2 className="mt-1 font-display text-display-sm text-ink">
            {filter === "active"
              ? `${availCount} of ${items.length} items live`
              : `${archivedItems.length} archived`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filter === "active" ? (
            <>
              <Button size="default" variant="outline" onClick={onResetAll}>
                Reset all
              </Button>
              <Button
                size="default"
                data-coachmark-target="menu-add"
                onClick={openCreate}
              >
                + Add item
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          size="default"
          variant={filter === "active" ? "primary" : "outline"}
          onClick={() => setFilter("active")}
        >
          Active
        </Button>
        <Button
          size="default"
          variant={filter === "archived" ? "primary" : "outline"}
          onClick={() => setFilter("archived")}
        >
          Archived
        </Button>
      </div>

      {actionError ? (
        <p className="mb-3 font-body text-caption text-error" role="alert">
          {actionError}
        </p>
      ) : null}

      {!ready ? (
        <p className="font-body text-body-sm text-muted">Loading…</p>
      ) : visibleItems.length === 0 ? (
        <Card padding="md" className="text-center">
          <p className="font-body text-body-md text-muted">
            {filter === "active"
              ? "No active menu items yet."
              : "No archived items."}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visibleItems.map((item) => (
            <MenuRow
              key={item.id}
              item={item}
              archived={filter === "archived"}
              onEdit={() => openEdit(item)}
              onDuplicate={() => void handleDuplicate(item)}
              onToggle={() => onToggle(item.id)}
              onArchive={() =>
                requireToken(() => setConfirmArchiveId(item.id))
              }
              onRestore={() => requireToken(() => void handleRestore(item.id))}
            />
          ))}
        </div>
      )}

      {filter === "active" && ready ? (
        <button
          type="button"
          onClick={openCreate}
          className="mt-4 flex w-full flex-col items-center justify-center gap-1 rounded-brand-lg border border-dashed border-hairline-strong px-4 py-6 text-muted transition-colors hover:border-primary hover:text-ink"
        >
          <span className="font-body text-body-md font-medium">+ Add item</span>
          <span className="font-body text-caption text-muted-soft">
            Add more dishes to your menu
          </span>
        </button>
      ) : null}

      <MenuItemModal
        open={editorOpen}
        mode={editorMode}
        item={editingItem}
        categories={categories}
        saving={saving}
        serverError={actionError}
        vendorSlug={vendorSlug}
        ownerToken={token}
        onClose={() => {
          setEditorOpen(false);
          setActionError(null);
        }}
        onSubmit={(values, options) => void handleSubmit(values, options)}
        onToggleAvailability={handleModalToggle}
        onImagesChange={(images) => {
          setEditingItem((prev) =>
            prev ? { ...prev, images, imageUrl: images.find((i) => i.isPrimary)?.url } : prev
          );
          void onRefresh();
        }}
      />

      {confirmArchiveId ? (
        <Modal
          open
          onClose={() => setConfirmArchiveId(null)}
          title="Archive item?"
        >
          <p className="font-body text-body-sm text-muted">
            It will disappear from the storefront and active menu. You can restore
            it from the Archived tab.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              size="kds"
              className="flex-1"
              disabled={saving}
              onClick={() => void handleArchive(confirmArchiveId)}
            >
              Archive
            </Button>
            <Button
              size="kds"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmArchiveId(null)}
            >
              Cancel
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
