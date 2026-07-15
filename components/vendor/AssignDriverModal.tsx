"use client";

import { useId, useMemo, useState } from "react";
import type { Driver } from "@/lib/types";
import { formatPhoneDisplay, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface AssignDriverModalProps {
  open: boolean;
  orderIds: string[];
  drivers: Driver[];
  busy: boolean;
  onClose: () => void;
  onAssign: (driverId: string) => void;
}

export function AssignDriverModal({
  open,
  orderIds,
  drivers,
  busy,
  onClose,
  onAssign,
}: AssignDriverModalProps) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    open ? drivers[0]?.id ?? null : null
  );

  // Reset on open/close or roster change ("adjust state during render").
  const [prevKey, setPrevKey] = useState({ open, drivers });
  if (prevKey.open !== open || prevKey.drivers !== drivers) {
    setPrevKey({ open, drivers });
    if (!open) {
      setQuery("");
      setSelectedId(null);
    } else {
      setSelectedId(drivers[0]?.id ?? null);
    }
  }

  const filteredDrivers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return drivers;
    return drivers.filter(
      (driver) =>
        driver.name.toLowerCase().includes(needle) ||
        driver.phone.toLowerCase().includes(needle)
    );
  }, [drivers, query]);

  const selectedDriver = drivers.find((driver) => driver.id === selectedId) ?? null;

  const title =
    orderIds.length === 1
      ? `Assign driver to order #${orderDisplayId(orderIds[0] ?? "")}`
      : `Assign driver to ${orderIds.length} orders`;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close assign driver dialog"
        className="zt-overlay-enter absolute inset-0 bg-canvas-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="zt-sheet-enter zt-hidescroll relative z-10 max-h-[92vh] w-full max-w-kds overflow-y-auto rounded-t-brand-xl border border-b-0 border-hairline bg-surface-card shadow-brand-soft"
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-soft" aria-hidden />
        </div>
        <div className="px-5 pb-[26px] pt-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="font-display text-display-md text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-hairline bg-surface-card transition-colors hover:bg-canvas-soft"
              aria-label="Close"
            >
              <Icon name="close" size={18} className="text-muted" strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-5 flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Search drivers</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search drivers"
                className="h-11 w-full rounded-brand-lg border border-hairline bg-surface-strong px-3 font-body text-body-sm text-ink outline-none focus:border-primary"
              />
            </label>
            <div
              className="flex h-11 flex-none items-center rounded-brand-lg border border-hairline bg-surface-strong px-3 font-body text-body-sm text-muted"
              title="Coming soon"
            >
              All status
              <span className="ml-2 rounded-pill bg-primary/15 px-2 py-0.5 text-caption text-primary">
                Soon
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {filteredDrivers.length === 0 ? (
              <p className="rounded-brand-lg border border-hairline bg-surface-strong p-4 text-center font-body text-body-sm text-muted">
                {drivers.length === 0
                  ? "Add a driver in the Drivers tab first."
                  : "No drivers match your search."}
              </p>
            ) : (
              filteredDrivers.map((driver) => {
                const selected = selectedId === driver.id;
                return (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedId(driver.id)}
                    className={cn(
                      "flex min-h-[60px] items-center gap-[13px] rounded-brand-lg border p-3.5 text-left transition-colors",
                      selected
                        ? "border-primary/50 bg-primary/10"
                        : "border-hairline bg-surface-strong hover:bg-canvas-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 flex-none items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary text-on-primary"
                          : "border-hairline-strong bg-surface-card"
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <Icon name="check" size={12} strokeWidth={3} />
                      ) : null}
                    </span>
                    <div
                      className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-brand-lg text-base font-medium"
                      style={{
                        background: `${driver.hue}26`,
                        border: `1.5px solid ${driver.hue}73`,
                        color: driver.hue,
                      }}
                    >
                      {driver.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-body-md font-medium text-ink">
                        {driver.name}
                      </div>
                      <div className="font-mono font-body text-body-sm text-muted">
                        {formatPhoneDisplay(driver.phone)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="kds"
            disabled={!selectedDriver || busy || drivers.length === 0}
            onClick={() => {
              if (!selectedDriver) return;
              onAssign(selectedDriver.id);
            }}
            className="mt-[18px] w-full rounded-pill"
          >
            {selectedDriver
              ? `Assign to ${selectedDriver.name}`
              : "Select a driver"}
          </Button>

          <div className="mt-3 flex items-center gap-2 rounded-brand-lg border border-hairline bg-surface-strong px-3.5 py-3">
            <Icon name="phone" size={18} className="text-primary" strokeWidth={2} />
            <p className="font-body text-body-sm text-muted">
              Call the driver after assigning to coordinate delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
