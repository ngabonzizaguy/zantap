"use client";

import Image from "next/image";
import { useState } from "react";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";
import { Icon } from "@/components/ui/Icon";
import { Button, Modal } from "@/components/ui/primitives";
import { translateKdsLabel } from "@/lib/i18n/kds-labels";
import type { KdsTranslate } from "@/lib/i18n/kds-localize";
import {
  deriveReadinessContext,
  recordReadinessGuideChoice,
  recordReadinessGuideDismissal,
  type KdsReadiness,
  type KdsReadinessItem,
  type KdsReadinessItemId,
} from "@/lib/kds/visual-guides";
import { cn } from "@/lib/cn";

interface ReadinessGuideModalProps {
  readiness: KdsReadiness;
  vendorSlug: string;
  onClose: () => void;
  onGoToOrders: () => void;
  onReviewSetup: () => void;
  onShowMeWhere: (itemId: KdsReadinessItemId) => void;
  initialView?: "welcome" | "checklist";
}

const READINESS_SCREENSHOT_ALT_KEYS = {
  storefront: "kds.readiness-guide.storefront-screenshot-alt",
  menu: "kds.readiness-guide.menu-screenshot-alt",
  payment: "kds.readiness-guide.payment-screenshot-alt",
  kitchen: "kds.readiness-guide.kitchen-screenshot-alt",
} as const;

function translateReadinessText(t: KdsTranslate, text: string): string {
  const fixed = translateKdsLabel(t, text);
  if (fixed !== text) return fixed;

  const missing = text.match(/^Missing: (.+)$/);
  if (missing) {
    const details = missing[1]
      .split(", ")
      .map((detail) =>
        translateKdsLabel(
          t,
          detail.replace(/^./, (character) => character.toUpperCase())
        )
      )
      .join(", ");
    return t("kds.readiness-guide.missing", { details });
  }

  const available = text.match(/^(\d+) available dishes?$/);
  if (available) {
    const count = Number(available[1]);
    return t(
      count === 1
        ? "kds.readiness-guide.available-dish"
        : "kds.readiness-guide.available-dishes",
      { count }
    );
  }

  const payout = text.match(/^(Phone|Merchant code) •••(.+)$/);
  if (payout) {
    return t("kds.readiness-guide.masked-payout", {
      method: t(
        payout[1] === "Phone"
          ? "kds.readiness-guide.phone"
          : "kds.readiness-guide.merchant-code"
      ),
      last4: payout[2],
    });
  }

  const warning = text.match(
    /^You can open now, but finish your (.+) so customers can order successfully\.$/
  );
  if (warning) {
    const items = warning[1]
      .split(" and ")
      .map((item) =>
        t(
          item === "menu"
            ? "kds.readiness-guide.menu"
            : "kds.readiness-guide.payment"
        )
      )
      .join(` ${t("kds.readiness-guide.and")} `);
    return t("kds.readiness-guide.open-now-warning", { items });
  }

  return text;
}

export function ReadinessGuideModal({
  readiness,
  vendorSlug,
  onClose,
  onGoToOrders,
  onReviewSetup,
  onShowMeWhere,
  initialView = "welcome",
}: ReadinessGuideModalProps) {
  const t = useKdsTranslation();
  const [view, setView] = useState<"welcome" | "checklist" | "context">(
    initialView
  );
  const [contextItemId, setContextItemId] =
    useState<KdsReadinessItemId | null>(null);
  const showReady = view === "checklist" && readiness.isReady;
  const nextIncompleteId = readiness.items.find((item) => !item.complete)?.id;
  const contextItem = contextItemId
    ? readiness.items.find((item) => item.id === contextItemId)
    : undefined;
  const context = contextItem
    ? deriveReadinessContext(contextItem, readiness)
    : undefined;

  const safelyStore = (write: () => void) => {
    try {
      write();
    } catch {
      // Storage is a convenience; private browsing must never trap the Vendor.
    }
  };

  const handleClose = () => {
    safelyStore(() => recordReadinessGuideDismissal(localStorage, vendorSlug));
    onClose();
  };

  const handleGuideMe = () => {
    safelyStore(() =>
      recordReadinessGuideChoice(localStorage, vendorSlug, "guided")
    );
    setView("checklist");
  };

  const handleSelf = () => {
    safelyStore(() =>
      recordReadinessGuideChoice(localStorage, vendorSlug, "self")
    );
    onClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      ariaLabel={t("kds.readiness-guide.become-ready-to-receive-orders")}
      className="max-w-[25rem] border-white/15 bg-[#141416] shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
    >
      <div className="relative min-h-[31rem] px-1 pb-2 pt-1 text-center sm:min-h-[34rem] sm:px-2">
        <button
          type="button"
          aria-label={t("kds.readiness-guide.close-readiness-guide")}
          onClick={handleClose}
          className="absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon name="close" size={18} />
        </button>

        {view === "welcome" ? (
          <div className="zt-list-in flex min-h-[31rem] flex-col items-center justify-center px-2 py-8 sm:min-h-[34rem]">
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_32px_rgba(245,166,35,0.15)]">
              <Image
                src="/brand/approved-z/zantap-z-avatar-offwhite-1024.png"
                alt=""
                width={42}
                height={42}
                className="rounded-brand-md"
                priority
              />
              <span className="absolute -right-2 top-1 text-primary" aria-hidden>
                ✦
              </span>
              <span className="absolute -left-2 bottom-2 text-primary" aria-hidden>
                ✦
              </span>
            </div>

            <h2 className="max-w-[18rem] font-display text-[2rem] font-light leading-[1.08] tracking-[-0.02em] text-ink">
              {t("kds.readiness-guide.welcome-to-your-kitchen")}
            </h2>
            <p className="mt-5 max-w-[17rem] font-body text-body-md leading-relaxed text-ink">
              {t("kds.readiness-guide.lets-make-sure-youre-ready")}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3">
              <Button
                size="kds"
                radius="lg"
                className="w-full bg-primary text-[#0c0a09] hover:bg-[#ffb52b]"
                onClick={handleGuideMe}
              >
                {t("kds.readiness-guide.guide-me")}
              </Button>
              <Button
                size="kds"
                radius="lg"
                variant="outline"
                className="w-full border-primary text-primary hover:border-primary hover:bg-primary/5"
                onClick={handleSelf}
              >
                {t("kds.readiness-guide.ill-do-it-myself")}
              </Button>
            </div>

            <p className="mt-5 font-body text-caption text-muted">
              {t("kds.readiness-guide.replay-anytime")}
            </p>
          </div>
        ) : context ? (
          <div className="zt-list-in flex min-h-[31rem] flex-col py-6 text-left sm:min-h-[34rem]">
            <div className="pr-12">
              <p className="font-body text-caption-uppercase uppercase tracking-[0.08em] text-primary">
                {t("kds.readiness-guide.readiness-guide")}
              </p>
              <h2 className="mt-2 font-display text-[2rem] font-light leading-[1.08] tracking-[-0.02em] text-ink">
                {translateReadinessText(t, context.title)}
              </h2>
            </div>

            <div className="mt-5 rounded-brand-lg border border-white/10 bg-black/15 px-4 py-3">
              <p className="font-body text-caption text-muted">
                {t("kds.readiness-guide.current-status")}
              </p>
              <p className="mt-1 font-body text-body-strong text-ink" aria-live="polite">
                {translateReadinessText(t, context.status)}
              </p>
            </div>

            <p className="mt-4 font-body text-body-sm leading-relaxed text-muted">
              {translateReadinessText(t, context.reason)}
            </p>

            <div className="relative mt-5 overflow-hidden rounded-brand-lg border border-white/15 bg-black/30">
              <Image
                src={context.screenshotSrc}
                alt={t(READINESS_SCREENSHOT_ALT_KEYS[context.itemId])}
                width={960}
                height={600}
                className="aspect-[16/9] w-full object-cover object-top"
              />
              <div className="absolute inset-x-3 bottom-3 rounded-brand-md border border-primary/70 bg-[#141416]/95 px-3 py-2 shadow-brand-soft">
                <p className="font-body text-caption text-primary">
                  {translateReadinessText(t, context.annotation)}
                </p>
              </div>
            </div>

            {context.warning ? (
              <p className="mt-4 rounded-brand-md border border-primary/50 bg-primary/10 px-3 py-2 font-body text-caption text-primary" role="note">
                {translateReadinessText(t, context.warning)}
              </p>
            ) : null}

            <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row-reverse">
              <Button
                size="kds"
                radius="lg"
                className="w-full bg-primary text-[#0c0a09] hover:bg-[#ffb52b]"
                onClick={() => onShowMeWhere(context.itemId)}
              >
                {translateReadinessText(t, context.actionLabel)}
              </Button>
              <Button
                size="kds"
                radius="lg"
                variant="outline"
                className="w-full border-white/20 text-ink hover:border-primary hover:text-primary"
                onClick={() => {
                  setContextItemId(null);
                  setView("checklist");
                }}
              >
                {t("kds.readiness-guide.back-to-checklist")}
              </Button>
            </div>
          </div>
        ) : showReady ? (
          <div className="zt-list-in flex min-h-[31rem] flex-col items-center justify-center py-7 sm:min-h-[34rem]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-success/70 bg-success/15 text-success shadow-[0_0_28px_rgba(34,197,94,0.2)]">
              <Icon name="check" size={32} strokeWidth={2.1} />
            </div>

            <h2 className="font-display text-[2rem] font-light leading-tight tracking-[-0.02em] text-ink">
              {t("kds.readiness-guide.ready-for-orders")}
            </h2>
            <p className="mt-2 max-w-[17rem] font-body text-body-sm text-muted">
              {t("kds.readiness-guide.customers-can-now-order")}
            </p>

            <ReadinessList
              readiness={readiness}
              compact
              onSelectItem={(itemId) => {
                setContextItemId(itemId);
                setView("context");
              }}
            />

            <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-brand-lg border border-success/60 bg-success/10 px-4 py-3 font-body text-title-sm font-medium text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden />
              {t("kds.readiness-guide.open-live")}
            </div>

            <Button
              size="kds"
              radius="lg"
              className="mt-4 w-full bg-primary text-[#0c0a09] hover:bg-[#ffb52b]"
              onClick={onGoToOrders}
            >
              {t("kds.readiness-guide.go-to-orders")}
            </Button>
            <button
              type="button"
              onClick={onReviewSetup}
              className="mt-3 min-h-11 px-4 font-body text-button text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("kds.readiness-guide.review-setup")}
            </button>
            <p className="mt-2 font-body text-caption text-muted">
              {t("kds.readiness-guide.visual-guides-stay-available")}
            </p>
          </div>
        ) : (
          <div className="zt-list-in flex min-h-[31rem] flex-col py-6 text-left sm:min-h-[34rem]">
            <div className="pr-12">
              <div className="flex items-start justify-between gap-4">
                <h2 className="min-w-0 flex-1 font-display text-[2rem] font-light leading-[1.08] tracking-[-0.02em] text-ink">
                  {t("kds.readiness-guide.get-ready-to-receive-orders")}
                </h2>
                <p className="min-w-[3.5rem] flex-none whitespace-nowrap pt-1 text-right font-body text-body-strong text-primary" aria-live="polite">
                  {t("kds.readiness-guide.completed-count", {
                    completed: readiness.completedCount,
                    total: readiness.items.length,
                  })}
                </p>
              </div>
              <p className="mt-3 font-body text-body-sm text-muted">
                {t("kds.readiness-guide.complete-in-any-order")}
              </p>
            </div>

            <ReadinessList
              readiness={readiness}
              nextIncompleteId={nextIncompleteId}
              onSelectItem={(itemId) => {
                setContextItemId(itemId);
                setView("context");
              }}
            />

            <div className="mt-5 rounded-brand-lg border border-white/10 bg-black/15 px-4 py-4">
              <p className="font-body text-body-sm text-muted">
                {t("kds.readiness-guide.finish-remaining-setup")}
              </p>
            </div>

            <p className="mt-auto pt-5 text-center font-body text-caption text-muted">
              {t("kds.readiness-guide.close-anytime")}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ReadinessList({
  readiness,
  compact = false,
  nextIncompleteId,
  onSelectItem,
}: {
  readiness: KdsReadiness;
  compact?: boolean;
  nextIncompleteId?: string;
  onSelectItem?: (itemId: KdsReadinessItemId) => void;
}) {
  const t = useKdsTranslation();

  return (
    <ul
      className={cn(
        "w-full overflow-hidden rounded-brand-lg border border-white/10 bg-black/10 text-left",
        compact ? "mt-5" : "mt-6"
      )}
    >
      {readiness.items.map((item, index) => {
        const suggested = !item.complete && item.id === nextIncompleteId;
        const rowClassName = cn(
          "flex w-full items-center gap-3 border-b border-white/10 px-4 text-left last:border-b-0",
          compact ? "min-h-11" : "min-h-14",
          suggested &&
            "m-[-1px] rounded-brand-lg border border-primary bg-primary/5 last:border-b",
          onSelectItem &&
            "cursor-pointer transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        );
        const content = (
          <ReadinessRowContent
            item={item}
            index={index}
            suggested={suggested}
            compact={compact}
            interactive={Boolean(onSelectItem)}
          />
        );
        return (
          <li key={item.id}>
            {onSelectItem ? (
              <button
                type="button"
                className={rowClassName}
                onClick={() => onSelectItem(item.id)}
                aria-label={t("kds.readiness-guide.item-aria", {
                  label: translateReadinessText(t, item.label),
                  detail: translateReadinessText(t, item.detail),
                  action: item.complete
                    ? t("kds.readiness-guide.view-setup")
                    : t("kds.readiness-guide.open-guide"),
                })}
              >
                {content}
              </button>
            ) : (
              <div className={rowClassName}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ReadinessRowContent({
  item,
  index,
  suggested,
  compact,
  interactive,
}: {
  item: KdsReadinessItem;
  index: number;
  suggested: boolean;
  compact: boolean;
  interactive: boolean;
}) {
  const t = useKdsTranslation();

  return (
    <>
      <span
        className={cn(
          "flex h-7 w-7 flex-none items-center justify-center rounded-full border font-body text-caption font-medium",
          item.complete
            ? "border-success bg-success/10 text-success"
            : suggested
              ? "border-primary bg-primary text-[#0c0a09]"
              : "border-white/20 text-muted"
        )}
        aria-hidden="true"
      >
        {item.complete ? (
          <Icon name="check" size={16} strokeWidth={2.2} />
        ) : (
          index + 1
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-body text-body-md text-ink">
          {translateReadinessText(t, item.label)}
        </span>
        {!compact || interactive ? (
          <span
            className={cn(
              "mt-0.5 block font-body text-caption",
              suggested ? "text-primary" : "text-muted"
            )}
          >
            {translateReadinessText(t, item.detail)}
            {item.complete && interactive
              ? t("kds.readiness-guide.action-suffix", {
                  action: t("kds.readiness-guide.view-setup"),
                })
              : suggested && item.actionLabel
                ? t("kds.readiness-guide.action-suffix", {
                    action: translateReadinessText(t, item.actionLabel),
                  })
                : ""}
          </span>
        ) : null}
      </span>
      {interactive ? (
        <Icon
          name="chevronRight"
          size={20}
          className={cn("flex-none", suggested ? "text-primary" : "text-muted")}
        />
      ) : null}
      <span className="sr-only">
        {item.complete
          ? t("kds.readiness-guide.complete")
          : t("kds.readiness-guide.not-complete")}
      </span>
    </>
  );
}
