"use client";

import type { OrderHistoryFilters as Filters } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui/primitives";

export type DatePreset = NonNullable<Filters["datePreset"]>;

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7" },
  { id: "last30", label: "Last 30" },
  { id: "custom", label: "Custom" },
];

const ORDER_STATUSES: { value: Filters["status"]; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUSES: { value: Filters["paymentStatus"]; label: string }[] = [
  { value: "ALL", label: "All payments" },
  { value: "PENDING", label: "Payment pending" },
  { value: "SUCCESS", label: "Payment success" },
  { value: "FAILED", label: "Payment failed" },
];

interface OrderHistoryFiltersProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  /** Non-custom date presets apply + refetch immediately (B2). */
  onDatePresetApply: (preset: DatePreset) => void;
  onApply: () => void;
  loading?: boolean;
}

function toDateInputValue(value?: Date): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function OrderHistoryFilters({
  filters,
  onChange,
  onDatePresetApply,
  onApply,
  loading = false,
}: OrderHistoryFiltersProps) {
  const preset = filters.datePreset ?? "last30";

  const handlePresetClick = (itemId: DatePreset) => {
    if (itemId === "custom") {
      onChange({ ...filters, datePreset: "custom" });
      return;
    }
    onDatePresetApply(itemId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="zt-hidescroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {DATE_PRESETS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="default"
            variant={preset === item.id ? "primary" : "outline"}
            className="min-w-[88px] shrink-0 snap-start"
            onClick={() => handlePresetClick(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {preset === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="From"
            type="date"
            value={toDateInputValue(filters.dateFrom)}
            onChange={(event) =>
              onChange({
                ...filters,
                datePreset: "custom",
                dateFrom: event.target.value
                  ? new Date(`${event.target.value}T12:00:00`)
                  : undefined,
              })
            }
          />
          <Input
            label="To"
            type="date"
            value={toDateInputValue(filters.dateTo)}
            onChange={(event) =>
              onChange({
                ...filters,
                datePreset: "custom",
                dateTo: event.target.value
                  ? new Date(`${event.target.value}T12:00:00`)
                  : undefined,
              })
            }
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Order status"
          value={filters.status ?? "ALL"}
          options={ORDER_STATUSES.map((option) => ({
            value: option.value ?? "ALL",
            label: option.label,
          }))}
          onChange={(status) =>
            onChange({
              ...filters,
              status,
            })
          }
        />

        <Select
          label="Payment status"
          value={filters.paymentStatus ?? "ALL"}
          options={PAYMENT_STATUSES.map((option) => ({
            value: option.value ?? "ALL",
            label: option.label,
          }))}
          onChange={(paymentStatus) =>
            onChange({
              ...filters,
              paymentStatus,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="Search phone or order #"
          placeholder="e.g. 0788 or #1204"
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          className="flex-1"
        />
        <Button
          type="button"
          size="kds"
          variant="primary"
          className="sm:min-w-[140px]"
          disabled={loading}
          onClick={onApply}
        >
          {loading ? "Loading…" : "Apply filters"}
        </Button>
      </div>
    </div>
  );
}
