"use client";

import { translateKdsLabel } from "@/lib/i18n/kds-labels";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import { useCallback, useEffect, useState } from "react";
import type {
  CreateVendorExpenseInput,
  ProfitSnapshot,
  VendorExpense,
} from "@/lib/vendor/feature-and-profit-types";
import {
  createVendorExpense,
  deleteVendorExpense,
  loadProfitSnapshot,
  loadVendorExpenses,
} from "@/lib/actions/vendor-profit";
import { formatRwf } from "@/lib/format";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { Icon } from "@/components/ui/Icon";
import { Button, Card, Input, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface ProfitPanelProps {
  vendorSlug: string;
  open: boolean;
  onClose: () => void;
}

type PeriodPreset = "today" | "last7" | "last30";

function periodRange(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const from = new Date(to);
  if (preset === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (preset === "last7") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Today",
  last7: "Last 7 days",
  last30: "Last 30 days",
};

const EXPENSE_CATEGORIES = [
  "Ingredients",
  "Packaging",
  "Delivery",
  "Rent",
  "Utilities",
  "Staff",
  "Equipment",
  "Marketing",
  "Other",
];

export function ProfitPanel({ vendorSlug, open, onClose }: ProfitPanelProps) {
  const t = useKdsTranslation();
  const { token: ownerToken } = useOwnerToken(vendorSlug);
  const [period, setPeriod] = useState<PeriodPreset>("last7");
  const [snapshot, setSnapshot] = useState<ProfitSnapshot | null>(null);
  const [expenses, setExpenses] = useState<VendorExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = periodRange(period);
      const [snap, exps] = await Promise.all([
        loadProfitSnapshot(vendorSlug, from, to),
        loadVendorExpenses(vendorSlug, from, to),
      ]);
      setSnapshot(snap);
      setExpenses(exps);
    } catch {
      setSnapshot(null);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [vendorSlug, period]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const { from, to } = periodRange(period);
        const [snap, exps] = await Promise.all([
          loadProfitSnapshot(vendorSlug, from, to),
          loadVendorExpenses(vendorSlug, from, to),
        ]);
        if (!cancelled) {
          setSnapshot(snap);
          setExpenses(exps);
        }
      } catch {
        if (!cancelled) {
          setSnapshot(null);
          setExpenses([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [open, period, vendorSlug]);

  const handleAddExpense = async () => {
    if (!ownerToken) return;
    const amount = Number.parseFloat(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError("Enter a valid amount.");
      return;
    }
    setExpenseSaving(true);
    setExpenseError(null);
    try {
      const input: CreateVendorExpenseInput = {
        amountRwf: amount,
        category: expenseCategory,
        note: expenseNote.trim() || undefined,
      };
      await createVendorExpense(ownerToken, vendorSlug, input);
      setExpenseAmount("");
      setExpenseNote("");
      setShowExpenseForm(false);
      await refreshData();
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!ownerToken) return;
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteVendorExpense(ownerToken, vendorSlug, expenseId);
      await refreshData();
    } catch {
      // silent
    }
  };

  if (!open) return null;

  const s = snapshot;
  const glowColor =
    s && s.glowScore >= 0.3
      ? "text-success"
      : s && s.glowScore >= -0.1
        ? "text-amber-400"
        : "text-error";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-4">
        <h2 className="font-display text-display-md text-ink">{t("kds.profit-panel.know-your-profit")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-lg font-bold text-ink hover:bg-canvas-soft"
          aria-label={t("kds.profit-panel.close")}
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
        <div className="mb-4 flex gap-2">
          {(["today", "last7", "last30"] as PeriodPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-pill px-3.5 py-2 font-body text-body-sm font-medium transition-colors",
                period === p
                  ? "bg-primary/15 text-primary"
                  : "bg-surface-strong text-muted hover:text-ink"
              )}
            >
              {translateKdsLabel(t, PERIOD_LABELS[p])}
            </button>
          ))}
        </div>

        {loading ? (
          <Card padding="lg" className="text-center">
            <p className="font-body text-body-md text-muted">{t("kds.profit-panel.loading")}</p>
          </Card>
        ) : !s ? (
          <Card padding="lg" className="text-center">
            <p className="font-body text-body-md text-muted">{t("kds.profit-panel.no-profit-data-available-yet")}</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Card padding="sm" className="border-l-2 border-l-primary shadow-none">
                <p className="font-body text-caption-uppercase text-muted">{t("kds.profit-panel.revenue")}</p>
                <p className="mt-1 font-display text-display-sm text-ink">
                  {formatRwf(s.periodRevenueRwf)}
                </p>
              </Card>
              <Card padding="sm" className="shadow-none">
                <p className="font-body text-caption-uppercase text-muted">{t("kds.profit-panel.expenses")}</p>
                <p className="mt-1 font-display text-display-sm text-ink">
                  {formatRwf(s.periodExpensesRwf)}
                </p>
              </Card>
              <Card padding="sm" className="shadow-none">
                <p className="font-body text-caption-uppercase text-muted">{t("kds.profit-panel.food-costs")}</p>
                <p className="mt-1 font-display text-display-sm text-ink">
                  {formatRwf(s.periodCostOfGoodsRwf)}
                </p>
              </Card>
              <Card
                padding="sm"
                className={cn(
                  "shadow-none",
                  s.periodProfitRwf >= 0
                    ? "border-l-2 border-l-success"
                    : "border-l-2 border-l-error"
                )}
              >
                <p className="font-body text-caption-uppercase text-muted">{t("kds.profit-panel.profit")}</p>
                <p
                  className={cn(
                    "mt-1 font-display text-display-sm",
                    s.periodProfitRwf >= 0 ? "text-success" : "text-error"
                  )}
                >
                  {formatRwf(s.periodProfitRwf)}
                </p>
              </Card>
            </div>

            <Card padding="sm" className="mt-4 shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-caption-uppercase text-muted">{t("kds.profit-panel.weekday-average")}</p>
                  <p className="mt-0.5 font-display text-display-sm text-ink">
                    {formatRwf(s.weekdayAverageRwf)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-caption-uppercase text-muted">{t("kds.profit-panel.performance")}</p>
                  <p className={cn("mt-0.5 font-body text-body-strong font-semibold", glowColor)}>
                    {s.glowScore >= 0 ? "+" : ""}
                    {(s.glowScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </Card>

            {s.itemMargins.length > 0 && (
              <section className="mt-6">
                <h3 className="font-display text-display-sm text-ink">{t("kds.profit-panel.profit-by-menu-item")}</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {s.itemMargins.map((m) => (
                    <Card key={m.menuItemId} padding="sm" className="shadow-none">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body text-body-md font-medium text-ink">
                            {m.name}
                          </p>
                          <p className="mt-0.5 font-body text-body-sm text-muted">
                            {m.soldQty}{" "}{t("kds.profit-panel.sold-rev")}{" "}{formatRwf(m.revenueRwf)}{" "}{t("kds.profit-panel.cost")}{" "}
                            {formatRwf(m.costRwf)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "font-body text-body-strong font-semibold",
                            m.marginRwf >= 0 ? "text-success" : "text-error"
                          )}
                        >
                          {m.marginPct != null
                            ? t("kds.profit-panel.you-keep-value1", { value1: m.marginPct.toFixed(0) })
                            : formatRwf(m.marginRwf)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-display-sm text-ink">{t("kds.profit-panel.expenses")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setShowExpenseForm(true);
                    setExpenseError(null);
                  }}
                  disabled={!ownerToken}
                >
                  <Icon name="plus" size={16} strokeWidth={2.2} />{t("kds.profit-panel.add")}</Button>
              </div>

              {expenses.length === 0 && !showExpenseForm ? (
                <p className="mt-3 font-body text-body-sm text-muted">{t("kds.profit-panel.no-expenses-recorded-for-this-period")}</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {expenses.map((exp) => (
                    <Card key={exp.id} padding="sm" className="flex items-center gap-3 shadow-none">
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-body-md font-medium text-ink">
                          {exp.category}
                        </p>
                        {exp.note && (
                          <p className="mt-0.5 font-body text-body-sm text-muted">
                            {exp.note}
                          </p>
                        )}
                      </div>
                      <span className="font-body text-body-strong font-semibold text-ink">
                        {formatRwf(exp.amountRwf)}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleDeleteExpense(exp.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-brand-sm text-muted hover:text-error"
                        aria-label={t("kds.profit-panel.delete-expense")}
                      >
                        <Icon name="close" size={14} strokeWidth={2.2} />
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal
        open={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        title={t("kds.profit-panel.add-expense")}
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowExpenseForm(false)}
              disabled={expenseSaving}
            >{t("kds.profit-panel.cancel")}</Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={() => void handleAddExpense()}
              disabled={expenseSaving || !expenseAmount.trim()}
            >
              {expenseSaving ? t("kds.profit-panel.saving") : t("kds.profit-panel.save")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t("kds.profit-panel.amount-rwf")}
            type="number"
            inputMode="numeric"
            min={0}
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="2500"
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-body-sm font-medium text-ink">{t("kds.profit-panel.category")}</label>
            <select
              className="h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink focus:border-2 focus:border-ink focus:outline-none"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={translateKdsLabel(t, c)} value={translateKdsLabel(t, c)}>
                  {translateKdsLabel(t, c)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("kds.profit-panel.note-optional")}
            value={expenseNote}
            onChange={(e) => setExpenseNote(e.target.value)}
            placeholder={t("kds.profit-panel.what-was-this-expense-for")}
          />
          {expenseError && (
            <p className="font-body text-body-sm text-error">{expenseError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
