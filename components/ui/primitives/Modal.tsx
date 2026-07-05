"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Sticky actions pinned below the scroll region (Save/Cancel, etc.). */
  footer?: React.ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const HANDLE_HIDE_MS = 1400;
const DRAG_CLOSE_PX = 120;

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const hideHandleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ startY: number; startT: number } | null>(null);

  const [handleVisible, setHandleVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  onCloseRef.current = onClose;

  const revealHandle = useCallback(() => {
    setHandleVisible(true);
    if (hideHandleTimerRef.current) {
      clearTimeout(hideHandleTimerRef.current);
    }
    hideHandleTimerRef.current = setTimeout(() => {
      setHandleVisible(false);
    }, HANDLE_HIDE_MS);
  }, []);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setHandleVisible(false);
      setDragY(0);
      setDragging(false);
      if (hideHandleTimerRef.current) {
        clearTimeout(hideHandleTimerRef.current);
      }
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    if (justOpened) {
      const panel = panelRef.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
      focusables?.[0]?.focus({ preventScroll: true });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      const panel = panelRef.current;
      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open]);

  const onHandlePointerDown = (event: ReactPointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startT: Date.now() };
    setDragging(true);
    revealHandle();
  };

  const onHandlePointerMove = (event: ReactPointerEvent) => {
    if (!dragRef.current) return;
    setDragY(Math.max(0, event.clientY - dragRef.current.startY));
  };

  const finishDrag = (event: ReactPointerEvent) => {
    const start = dragRef.current;
    if (!start) return;

    const dy = Math.max(0, event.clientY - start.startY);
    const velocity = dy / Math.max(Date.now() - start.startT, 1);
    dragRef.current = null;
    setDragging(false);

    if (dy > DRAG_CLOSE_PX || velocity > 0.55) {
      onCloseRef.current();
      setDragY(0);
    } else {
      setDragY(0);
    }
  };

  if (!open || typeof document === "undefined") return null;

  // Portal to <body>: the KDS tab content lives in a `relative z-[1]` wrapper,
  // which would trap the dialog's z-index beneath the sticky z-30 header.
  // Wrap in `.kds-dark` so editorial tokens remap to the KDS charcoal palette.
  return createPortal(
    <div
      className="kds-dark fixed inset-0 z-[70] flex items-center justify-center p-4 text-ink"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : undefined,
        }}
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-brand-xl border border-hairline bg-surface-card shadow-brand-soft",
          "max-h-[min(90dvh,calc(100dvh-2rem))]",
          className
        )}
        onPointerDown={revealHandle}
        onTouchStart={revealHandle}
      >
        <div
          className="flex shrink-0 touch-none flex-col items-center pt-2"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div
            aria-hidden="true"
            className={cn(
              "h-1 w-10 rounded-full bg-primary transition-opacity duration-300",
              handleVisible ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {title ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-6 pb-4 pt-2">
            <h2
              id={titleId}
              className="font-display text-display-sm text-ink"
            >
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-strong text-ink transition-colors hover:bg-canvas-soft"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4",
            !title && "pt-2",
            footer
              ? "pb-4"
              : "pb-[max(1rem,env(safe-area-inset-bottom))]"
          )}
          onScroll={revealHandle}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-hairline px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
