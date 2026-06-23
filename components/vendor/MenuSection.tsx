"use client";

import { useCallback, useEffect, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getPrimaryImageUrl } from "@/lib/menu/media";
import { useWriteSecret } from "@/lib/vendor/useWriteSecret";
import {
  archiveMenuItem,
  createMenuItem,
  loadArchivedMenu,
  loadMenuCategories,
  restoreMenuItem,
  updateMenuItem,
} from "@/lib/actions/vendor-menu";
import { Badge, Button, Card, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { MenuItemModal, type MenuItemFormValues } from "@/components/vendor/MenuItemModal";
import { WriteSecretPrompt } from "@/components/vendor/WriteSecretPrompt";

type MenuFilter = "active" | "archived";

interface MenuCardProps {
  item: MenuItem;
  archived?: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onToggle?: () => void;
}

function MenuCard({
  item,
  archived = false,
  onEdit,
  onArchive,
  onRestore,
  onToggle,
}: MenuCardProps) {
  const thumbBg = `radial-gradient(circle at 32% 28%, ${item.thumbFrom ?? "#ffd2b0"}, ${item.thumbTo ?? "#f5945f"})`;
  const primaryImage = getPrimaryImageUrl(item);
  const available = item.isAvailable;

  return (
    <Card padding="sm" className="flex min-h-[220px] flex-col gap-3">
      <button
        type="button"
        onClick={onEdit}
        disabled={archived || !onEdit}
        className={cn(
          "flex flex-1 flex-col gap-3 text-left",
          archived ? "cursor-default" : "cursor-pointer"
        )}
      >
        <div
          className="h-24 w-full rounded-brand-md"
          style={{
            background: primaryImage
              ? `center / cover no-repeat url(${primaryImage})`
              : thumbBg,
          }}
        />
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-display-sm text-ink">{item.name}</h3>
            <p className="mt-1 font-body text-body-sm font-medium text-primary">
              {formatRwf(item.priceRwf)}
            </p>
          </div>
          <Badge variant={archived ? "muted" : "default"}>{item.category}</Badge>
        </div>
        {item.description ? (
          <p className="line-clamp-2 font-body text-body-sm text-muted">
            {item.description}
          </p>
        ) : null}
      </button>

      {archived ? (
        <Button size="kds" variant="outline" onClick={onRestore}>
          Restore item
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-label={`Toggle ${item.name} availability`}
            onClick={onToggle}
            className={cn(
              "flex h-[52px] items-center justify-between rounded-brand-md border px-3.5",
              available
                ? "border-success/30 bg-success/10"
                : "border-hairline-strong bg-canvas-soft"
            )}
          >
            <span
              className={cn(
                "font-body text-caption-uppercase font-medium uppercase tracking-wide",
                available ? "text-success" : "text-error"
              )}
            >
              {available ? "Available" : "Sold out"}
            </span>
            <span
              className={cn(
                "relative h-8 w-14 flex-none rounded-pill transition-colors",
                available ? "bg-success" : "bg-muted-soft"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-6 w-6 rounded-full bg-surface-card shadow-brand-soft transition-all",
                  available ? "left-7" : "left-1"
                )}
              />
            </span>
          </button>
          {onArchive ? (
            <Button size="kds" variant="outline" onClick={onArchive}>
              Archive
            </Button>
          ) : null}
        </div>
      )}
    </Card>
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
  const { secret, setSecret, hasSecret, ready } = useWriteSecret();
  const [filter, setFilter] = useState<MenuFilter>("active");
  const [archivedItems, setArchivedItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [secretPromptOpen, setSecretPromptOpen] = useState(false);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingWrite, setPendingWrite] = useState<(() => void) | null>(null);

  const loadCategories = useCallback(async () => {
    const next = await loadMenuCategories(vendorSlug);
    setCategories(next);
  }, [vendorSlug]);

  const loadArchived = useCallback(async () => {
    const next = await loadArchivedMenu(vendorSlug);
    setArchivedItems(next);
  }, [vendorSlug]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (filter === "archived") {
      void loadArchived();
    }
  }, [filter, loadArchived]);

  const requireSecret = useCallback(
    (action: () => void) => {
      if (!hasSecret) {
        setPendingWrite(() => action);
        setSecretPromptOpen(true);
        return;
      }
      action();
    },
    [hasSecret]
  );

  const handleSecretSaved = (value: string) => {
    setSecret(value);
    if (pendingWrite) {
      const run = pendingWrite;
      setPendingWrite(null);
      run();
    }
  };

  const parseActionError = (error: unknown): string => {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    if (message.toLowerCase().includes("write secret")) {
      return "Wrong write secret — tap the key icon to update it";
    }
    return message;
  };

  const runGuarded = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    if (!secret) {
      setActionError("Write secret required");
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
    requireSecret(() => setEditorOpen(true));
  };

  const openEdit = (item: MenuItem) => {
    setEditorMode("edit");
    setEditingItem(item);
    setActionError(null);
    requireSecret(() => setEditorOpen(true));
  };

  const handleSubmit = async (values: MenuItemFormValues) => {
    if (!secret) return;
    setSaving(true);
    setActionError(null);
    const priceRwf = Number(values.priceRwf);
    const payload = {
      name: values.name,
      priceRwf,
      description: values.description || undefined,
      category: values.category || "General",
    };

    const result =
      editorMode === "create"
        ? await runGuarded(() => createMenuItem(secret, vendorSlug, payload))
        : editingItem
          ? await runGuarded(() =>
              updateMenuItem(secret, vendorSlug, editingItem.id, payload)
            )
          : null;

    setSaving(false);
    if (result === null) return;

    setEditorOpen(false);
    await onRefresh();
    await loadCategories();
    if (filter === "archived") await loadArchived();
  };

  const handleArchive = async (itemId: string) => {
    if (!secret) return;
    setSaving(true);
    setActionError(null);
    const result = await runGuarded(() =>
      archiveMenuItem(secret, vendorSlug, itemId)
    );
    setSaving(false);
    setConfirmArchiveId(null);
    if (result) {
      await onRefresh();
      await loadArchived();
    }
  };

  const handleRestore = async (itemId: string) => {
    if (!secret) return;
    setSaving(true);
    setActionError(null);
    const result = await runGuarded(() =>
      restoreMenuItem(secret, vendorSlug, itemId)
    );
    setSaving(false);
    if (result) {
      await onRefresh();
      await loadArchived();
    }
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
          <Button
            size="default"
            variant="outline"
            onClick={() => setSecretPromptOpen(true)}
            aria-label="Write secret settings"
          >
            {hasSecret ? "🔑" : "Set secret"}
          </Button>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              archived={filter === "archived"}
              onEdit={() => openEdit(item)}
              onToggle={() => onToggle(item.id)}
              onArchive={() =>
                requireSecret(() => setConfirmArchiveId(item.id))
              }
              onRestore={() => requireSecret(() => void handleRestore(item.id))}
            />
          ))}
        </div>
      )}

      <MenuItemModal
        open={editorOpen}
        mode={editorMode}
        item={editingItem}
        categories={categories}
        saving={saving}
        serverError={actionError}
        vendorSlug={vendorSlug}
        writeSecret={secret}
        onClose={() => {
          setEditorOpen(false);
          setActionError(null);
        }}
        onSubmit={(values) => void handleSubmit(values)}
        onImagesChange={(images) => {
          setEditingItem((prev) =>
            prev ? { ...prev, images, imageUrl: images.find((i) => i.isPrimary)?.url } : prev
          );
          void onRefresh();
        }}
      />

      <WriteSecretPrompt
        open={secretPromptOpen}
        onSave={handleSecretSaved}
        onClose={() => {
          setSecretPromptOpen(false);
          setPendingWrite(null);
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
