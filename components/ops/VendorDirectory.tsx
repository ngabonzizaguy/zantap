"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { VendorListEntry } from "@/lib/types";
import { Badge, Button, Card, Input, Modal } from "@/components/ui/primitives";
import { suspendVendorAction, reactivateVendorAction } from "@/lib/ops-actions/vendor-actions";

interface VendorDirectoryProps {
  vendors: VendorListEntry[];
}

export function VendorDirectory({ vendors: initial }: VendorDirectoryProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initial);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "reactivate" | null>(
    null
  );
  const [reason, setReason] = useState("");

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.slug.toLowerCase().includes(q) ||
      v.phoneNumber.includes(q)
    );
  });

  function openConfirm(slug: string, action: "suspend" | "reactivate") {
    setConfirmSlug(slug);
    setConfirmAction(action);
    setReason("");
  }

  function closeConfirm() {
    setConfirmSlug(null);
    setConfirmAction(null);
    setReason("");
  }

  function handleConfirm() {
    if (!confirmSlug || !confirmAction) return;
    startTransition(async () => {
      try {
        if (confirmAction === "suspend") {
          await suspendVendorAction(confirmSlug, reason || undefined);
        } else {
          await reactivateVendorAction(confirmSlug);
        }
        closeConfirm();
        router.refresh();
      } catch {
        closeConfirm();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
            Vendors
          </h1>
          <p className="mt-1 text-sm text-muted">
            {vendors.length} storefront{vendors.length === 1 ? "" : "s"} on platform
          </p>
        </div>
        <Input
          placeholder="Search name, slug, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-surface-card lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hairline bg-canvas-soft text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Recovery</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((vendor) => (
              <tr key={vendor.id} className="border-b border-hairline-soft last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/ops/vendors/${vendor.slug}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {vendor.name}
                  </Link>
                  <p className="text-xs text-muted">/{vendor.slug}</p>
                </td>
                <td className="px-4 py-3 text-body">{vendor.phoneNumber}</td>
                <td className="px-4 py-3">
                  <Badge variant={vendor.isActive ? "success" : "default"} className={!vendor.isActive ? "bg-red-50 text-red-700" : undefined}>
                    {vendor.isActive ? "Active" : "Suspended"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">{vendor.recoveryEventCount}</td>
                <td className="px-4 py-3">
                  {vendor.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openConfirm(vendor.slug, "suspend")}
                      className="h-9 px-3 text-sm"
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => openConfirm(vendor.slug, "reactivate")}
                      className="h-9 px-3 text-sm"
                    >
                      Reactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {filtered.map((vendor) => (
          <Card key={vendor.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/ops/vendors/${vendor.slug}`}
                  className="font-medium text-ink"
                >
                  {vendor.name}
                </Link>
                <p className="text-xs text-muted">/{vendor.slug}</p>
              </div>
              <Badge variant={vendor.isActive ? "success" : "default"} className={!vendor.isActive ? "bg-red-50 text-red-700" : undefined}>
                {vendor.isActive ? "Active" : "Suspended"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{vendor.phoneNumber}</p>
            <div className="mt-4 flex gap-2">
              {vendor.isActive ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1"
                  onClick={() => openConfirm(vendor.slug, "suspend")}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="min-h-11 flex-1"
                  onClick={() => openConfirm(vendor.slug, "reactivate")}
                >
                  Reactivate
                </Button>
              )}
              <Link
                href={`/ops/vendors/${vendor.slug}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-pill border border-hairline-strong px-5 text-sm font-medium text-ink"
              >
                Details
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(confirmSlug && confirmAction)}
        onClose={closeConfirm}
        title={confirmAction === "suspend" ? "Suspend vendor?" : "Reactivate vendor?"}
      >
        <p className="text-sm text-muted">
          {confirmAction === "suspend"
            ? "Customers will not be able to order from this storefront."
            : "The storefront and checkout will be restored."}
        </p>
        {confirmAction === "suspend" ? (
          <Input
            className="mt-4"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        ) : null}
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={closeConfirm}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="min-h-11 flex-1"
            disabled={pending}
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
