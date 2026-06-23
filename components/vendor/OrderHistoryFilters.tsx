"use client";

import type { OrderHistoryFilters as Filters } from "@/lib/types";
import { Button, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

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
  onApply: () => void;
  loading?: boolean;
}

function toDateInputValue(value?: Date): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function selectClassName() {
  return cn(
    "h-11 min-h-11 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-3",
    "font-body text-body-md text-ink focus:border-2 focus:border-ink focus:outline-none"
  );
}

export function OrderHistoryFilters({
  filters,
  onChange,
  onApply,
  loading = false,
}: OrderHistoryFiltersProps) {
  const preset = filters.datePreset ?? "last30";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="default"
            variant={preset === item.id ? "primary" : "outline"}
            className="min-w-[88px]"
            onClick={() =>
              onChange({
                ...filters,
                datePreset: item.id,
              })
            }
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
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-body-sm font-medium text-ink">
            Order status
          </span>
          <select
            className={selectClassName()}
            value={filters.status ?? "ALL"}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as Filters["status"],
              })
            }
          >
            {ORDER_STATUSES.map((option) => (
              <option key={option.value} value={option.value ?? "ALL"}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-body-sm font-medium text-ink">
            Payment status
          </span>
          <select
            className={selectClassName()}
            value={filters.paymentStatus ?? "ALL"}
            onChange={(event) =>
              onChange({
                ...filters,
                paymentStatus: event.target.value as Filters["paymentStatus"],
              })
            }
          >
            {PAYMENT_STATUSES.map((option) => (
              <option key={option.value} value={option.value ?? "ALL"}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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
