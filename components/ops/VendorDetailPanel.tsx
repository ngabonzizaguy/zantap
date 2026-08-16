"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  MenuItem,
  OperatorAction,
  OperatorVendorDetail,
  Order,
} from "@/lib/types";
import { Badge, Button, Card, Input, Modal } from "@/components/ui/primitives";
import {
  archiveMenuItemAction,
  patchOrderAction,
  patchVendorAction,
  reactivateVendorAction,
  reissueOwnerTokenAction,
  revokeOwnerTokenAction,
  suspendVendorAction,
  toggleMenuAvailabilityAction,
} from "@/lib/ops-actions/vendor-actions";
import { getBaseUrl } from "@/lib/base-url";

type DetailTab = "overview" | "profile" | "flags" | "menu" | "orders" | "audit";

interface VendorDetailPanelProps {
  detail: OperatorVendorDetail;
  menu: MenuItem[];
  audit: OperatorAction[];
}

export function VendorDetailPanel({
  detail: initialDetail,
  menu: initialMenu,
  audit,
}: VendorDetailPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [detail, setDetail] = useState(initialDetail);
  const [menu, setMenu] = useState(initialMenu);
  const [pending, startTransition] = useTransition();
  const [tokenModal, setTokenModal] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: initialDetail.vendor.name,
    slug: initialDetail.vendor.slug,
    phoneNumber: initialDetail.vendor.phoneNumber,
    momoCode: initialDetail.vendor.momoCode,
    tagline: initialDetail.vendor.tagline ?? "",
    description: initialDetail.vendor.description ?? "",
  });

  const vendor = detail.vendor;
  const baseUrl = getBaseUrl();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  const [flags, setFlags] = useState({
    featureWhatsappNotify: initialDetail.vendor.featureWhatsappNotify,
  });

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "flags", label: "Flags" },
    { id: "menu", label: "Menu" },
    { id: "orders", label: "Orders" },
    { id: "audit", label: "Audit" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/ops" className="text-sm text-muted hover:text-ink">
            ← All vendors
          </Link>
          <h1 className="mt-2 font-display text-display-sm font-light tracking-tight text-ink">
            {vendor.name}
          </h1>
          <p className="text-sm text-muted">/{vendor.slug}</p>
        </div>
        <Badge
          variant={vendor.isActive ? "success" : "default"}
          className={!vendor.isActive ? "bg-red-50 text-red-700" : undefined}
        >
          {vendor.isActive ? "Active" : "Suspended"}
        </Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-pill px-4 py-2 text-sm ${
              tab === t.id
                ? "bg-ink text-on-primary"
                : "border border-hairline bg-surface-card text-body"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="hidden gap-2 lg:flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-pill px-4 py-2 text-sm ${
              tab === t.id
                ? "bg-ink text-on-primary"
                : "border border-hairline bg-surface-card text-body hover:border-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Menu items</p>
            <p className="mt-1 font-display text-2xl font-light">{detail.menuItemCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Active orders</p>
            <p className="mt-1 font-display text-2xl font-light">{detail.activeOrderCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Recovery events</p>
            <p className="mt-1 font-display text-2xl font-light">{detail.recoveryEventCount}</p>
          </Card>
          <>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted">
                  Stock tracked
                </p>
                <p className="mt-1 font-display text-2xl font-light">
                  {detail.stockTrackedItemCount ?? 0}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted">
                  Low stock
                </p>
                <p className="mt-1 font-display text-2xl font-light">
                  {detail.stockLowItemCount ?? 0}
                </p>
              </Card>
          </>
          <>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted">
                  Today&apos;s gross
                </p>
                <p className="mt-1 font-display text-2xl font-light">
                  {(detail.todayGrossRwf ?? 0).toLocaleString()} RWF
                </p>
                <p className="mt-1 text-xs text-muted">
                  Weekday avg {(detail.weekdayAverageRwf ?? 0).toLocaleString()}{" "}
                  RWF
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted">
                  7-day profit
                </p>
                <p className="mt-1 font-display text-2xl font-light">
                  {(detail.weekProfitRwf ?? 0).toLocaleString()} RWF
                </p>
              </Card>
          </>
          <Card className="space-y-3 p-4 sm:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-ink">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              {vendor.isActive ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await suspendVendorAction(vendor.slug);
                    })
                  }
                >
                  Suspend storefront
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await reactivateVendorAction(vendor.slug);
                    })
                  }
                >
                  Reactivate
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await revokeOwnerTokenAction(vendor.slug);
                  })
                }
              >
                Revoke owner token
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const result = await reissueOwnerTokenAction(vendor.slug);
                    setTokenModal(result.ownerToken);
                  })
                }
              >
                Reissue owner token
              </Button>
              <Link
                href={`/${vendor.slug}`}
                target="_blank"
                className="inline-flex min-h-11 items-center rounded-pill border border-hairline-strong px-5 text-sm font-medium"
              >
                Open storefront
              </Link>
              <Link
                href={`/vendor/${vendor.slug}`}
                target="_blank"
                className="inline-flex min-h-11 items-center rounded-pill border border-hairline-strong px-5 text-sm font-medium"
              >
                Open KDS
              </Link>
            </div>
            <p className="text-xs text-muted">
              Storefront URL: {baseUrl}/{vendor.slug}
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "profile" ? (
        <Card className="space-y-4 p-6">
          <Input
            label="Business name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Slug"
            value={profile.slug}
            onChange={(e) => setProfile((p) => ({ ...p, slug: e.target.value }))}
          />
          <Input
            label="Phone"
            value={profile.phoneNumber}
            onChange={(e) =>
              setProfile((p) => ({ ...p, phoneNumber: e.target.value }))
            }
          />
          <Input
            label="MoMo code"
            value={profile.momoCode}
            onChange={(e) => setProfile((p) => ({ ...p, momoCode: e.target.value }))}
          />
          <Input
            label="Tagline"
            value={profile.tagline}
            onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
          />
          <Input
            label="Description"
            value={profile.description}
            onChange={(e) =>
              setProfile((p) => ({ ...p, description: e.target.value }))
            }
          />
          <Button
            type="button"
            variant="primary"
            className="min-h-11"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const updated = await patchVendorAction(vendor.slug, profile);
                setDetail((d) => ({ ...d, vendor: updated }));
              })
            }
          >
            Save profile
          </Button>
        </Card>
      ) : null}

      {tab === "flags" ? (
        <Card className="space-y-6 p-6">
          <p className="text-sm font-medium text-ink">Feature flags</p>
          <p className="text-xs text-muted">
            Optional vendor-level features. Stock and complete profit insights are
            included for every vendor.
          </p>
          {(
            [
              { key: "featureWhatsappNotify", label: "WhatsApp notify", description: "Send WhatsApp alerts for new PAID orders" },
            ] as const
          ).map((flag) => (
            <label key={flag.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">{flag.label}</p>
                <p className="text-xs text-muted">{flag.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={flags[flag.key]}
                disabled={pending}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  flags[flag.key] ? "bg-ink" : "bg-surface-strong"
                }`}
                onClick={() =>
                  run(async () => {
                    const newVal = !flags[flag.key];
                    const updated = await patchVendorAction(vendor.slug, {
                      [flag.key]: newVal,
                    });
                    setDetail((d) => ({ ...d, vendor: updated }));
                    setFlags((f) => ({ ...f, [flag.key]: newVal }));
                  })
                }
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    flags[flag.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ))}
        </Card>
      ) : null}

      {tab === "menu" ? (
        <div className="space-y-3">
          {menu.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted">
                  {item.priceRwf.toLocaleString()} RWF · {item.category}
                  {!item.isAvailable ? " · Unavailable" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const updated = await toggleMenuAvailabilityAction(
                        vendor.slug,
                        item.id
                      );
                      setMenu((m) =>
                        m.map((row) => (row.id === item.id ? updated : row))
                      );
                    })
                  }
                >
                  Toggle availability
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await archiveMenuItemAction(vendor.slug, item.id);
                      setMenu((m) => m.filter((row) => row.id !== item.id));
                    })
                  }
                >
                  Archive
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "orders" ? (
        <OrderOverrides
          orders={detail.recentOrders}
          pending={pending}
          onPatch={(orderId, patch) =>
            run(async () => {
              await patchOrderAction(orderId, patch);
            })
          }
        />
      ) : null}

      {tab === "audit" ? (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas-soft">
          <ul className="divide-y divide-hairline-soft">
            {audit.map((row) => (
              <li key={row.id} className="px-4 py-3 font-mono text-xs text-body">
                <span className="text-muted">{new Date(row.at).toISOString()}</span>
                {" · "}
                <span className="text-ink">{row.action}</span>
                {row.detail ? ` · ${row.detail}` : ""}
              </li>
            ))}
            {audit.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted">
                No operator actions yet.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <Modal
        open={Boolean(tokenModal)}
        onClose={() => setTokenModal(null)}
        title="Owner token reissued"
      >
        <p className="text-sm text-muted">
          Copy this token now — it will not be shown again.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-canvas-soft p-4 text-xs">
          {tokenModal}
        </pre>
        <Button
          type="button"
          variant="primary"
          className="mt-4 min-h-11 w-full"
          onClick={() => setTokenModal(null)}
        >
          Done
        </Button>
      </Modal>
    </div>
  );
}

function OrderOverrides({
  orders,
  pending,
  onPatch,
}: {
  orders: Order[];
  pending: boolean;
  onPatch: (
    orderId: string,
    patch: { status?: Order["status"]; kitchenStage?: Order["kitchenStage"] }
  ) => void;
}) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">#{order.id.slice(-6)}</p>
              <p className="text-sm text-muted">
                {order.status}
                {order.kitchenStage ? ` · ${order.kitchenStage}` : ""} ·{" "}
                {order.totalAmount.toLocaleString()} RWF
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => onPatch(order.id, { status: "CANCELLED" })}
            >
              Force cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => onPatch(order.id, { kitchenStage: "COMPLETED" })}
            >
              Mark completed
            </Button>
          </div>
        </Card>
      ))}
      {orders.length === 0 ? (
        <p className="text-sm text-muted">No recent orders.</p>
      ) : null}
    </div>
  );
}
