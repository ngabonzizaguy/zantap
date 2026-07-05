"use client";

import { useMemo, useState } from "react";
import type { Driver } from "@/lib/types";
import {
  createDriver,
  deleteDriver,
  updateDriver,
} from "@/lib/actions/vendor-drivers";
import { formatPhoneDisplay } from "@/lib/format";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { Icon } from "@/components/ui/Icon";
import { Button, Card, Input, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface DriversPanelProps {
  vendorSlug: string;
  drivers: Driver[];
  onDriversChange: (drivers: Driver[]) => void;
}

type DriverFormMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; driver: Driver };

export function DriversPanel({
  vendorSlug,
  drivers,
  onDriversChange,
}: DriversPanelProps) {
  const { token: ownerToken } = useOwnerToken(vendorSlug);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<DriverFormMode>({ kind: "closed" });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDrivers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return drivers;
    return drivers.filter(
      (driver) =>
        driver.name.toLowerCase().includes(needle) ||
        driver.phone.toLowerCase().includes(needle)
    );
  }, [drivers, query]);

  const openAdd = () => {
    setName("");
    setPhone("");
    setError(null);
    setForm({ kind: "add" });
  };

  const openEdit = (driver: Driver) => {
    setName(driver.name);
    setPhone(driver.phone);
    setError(null);
    setForm({ kind: "edit", driver });
  };

  const closeForm = () => {
    setForm({ kind: "closed" });
    setError(null);
  };

  const handleSave = async () => {
    if (!ownerToken) return;
    setBusy(true);
    setError(null);
    try {
      if (form.kind === "add") {
        const created = await createDriver(ownerToken, vendorSlug, { name, phone });
        onDriversChange([...drivers, created]);
      } else if (form.kind === "edit") {
        const updated = await updateDriver(ownerToken, vendorSlug, form.driver.id, {
          name,
          phone,
        });
        if (!updated) {
          throw new Error("Driver not found");
        }
        onDriversChange(
          drivers.map((driver) => (driver.id === updated.id ? updated : driver))
        );
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save driver");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (driver: Driver) => {
    if (!ownerToken) return;
    if (!window.confirm(`Remove ${driver.name} from your driver list?`)) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await deleteDriver(ownerToken, vendorSlug, driver.id);
      if (!ok) throw new Error("Driver not found");
      onDriversChange(drivers.filter((row) => row.id !== driver.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete driver");
    } finally {
      setBusy(false);
    }
  };

  const formOpen = form.kind !== "closed";
  const formTitle = form.kind === "edit" ? "Edit driver" : "Add driver";

  return (
    <div className="relative pb-24">
      <div className="mb-4">
        <h2 className="font-display text-display-sm text-ink">Drivers</h2>
        <p className="mt-1 font-body text-body-sm text-muted">
          Manage delivery drivers and assign orders from the Orders tab.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search drivers"
          className="min-w-0 flex-1"
        />
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

      {error && !formOpen ? (
        <p className="mb-3 font-body text-body-sm text-error">{error}</p>
      ) : null}

      {filteredDrivers.length === 0 ? (
        <Card padding="md" className="text-center">
          <p className="font-body text-body-sm text-muted">
            {drivers.length === 0
              ? "No drivers yet. Add your first delivery driver."
              : "No drivers match your search."}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredDrivers.map((driver) => (
            <Card
              key={driver.id}
              padding="sm"
              className="flex items-center gap-3 border border-hairline"
            >
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
              <button
                type="button"
                onClick={() => openEdit(driver)}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-brand-md border border-hairline text-muted transition-colors hover:bg-canvas-soft hover:text-ink"
                aria-label={`Edit ${driver.name}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(driver)}
                disabled={busy}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-brand-md border border-hairline text-muted transition-colors hover:bg-canvas-soft hover:text-error"
                aria-label={`Remove ${driver.name}`}
              >
                <Icon name="close" size={16} strokeWidth={2.2} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={openAdd}
        className={cn(
          "fixed bottom-24 right-6 z-40 flex h-14 items-center gap-2 rounded-pill border border-[#7c6fe0]/40 bg-[#7c6fe0] px-5 font-body text-button font-medium text-white shadow-brand-soft transition-colors hover:bg-[#6f62d6]"
        )}
      >
        <Icon name="plus" size={18} strokeWidth={2.4} />
        Add driver
      </button>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={formTitle}
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeForm}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={() => void handleSave()}
              disabled={busy || !name.trim() || !phone.trim()}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-body text-caption-uppercase uppercase tracking-wide text-muted">
              Name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jean Claude"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-caption-uppercase uppercase tracking-wide text-muted">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0788 123 456"
            />
          </div>
          {error ? (
            <p className="font-body text-body-sm text-error">{error}</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
