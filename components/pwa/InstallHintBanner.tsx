"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  createBrowserInstallHintRuntime,
  createInstallHintController,
  type InstallHintMode,
} from "@/lib/pwa/install-hint";

/**
 * One-time "Install this app" top notice for the storefront (light editorial)
 * and the KDS (dark). Owner spec 2026-08-14:
 * - auto-hides after ~5s (slightly longer for iOS, which shows instructions);
 * - Android/Chrome: captures `beforeinstallprompt` and triggers the real
 *   install prompt from the Install button;
 * - iOS Safari: shows Add-to-Home-Screen instructions (no prompt API);
 * - shown once per visitor per surface (localStorage);
 * - never shown when already running installed (display-mode: standalone).
 */

interface InstallHintBannerProps {
  /** Visual theme: light storefront canvas vs dark KDS surface. */
  variant: "light" | "dark";
  /** Once-per-visitor bucket — storefront and KDS hints are independent. */
  surface: "customer" | "storefront" | "kds";
  /** App name shown in the notice (vendor name or "ZanTap Kitchen"). */
  appName: string;
  /** Customer installs stay gated until a meaningful storefront action. */
  unlocked?: boolean;
}

export function InstallHintBanner({
  variant,
  surface,
  appName,
  unlocked = true,
}: InstallHintBannerProps) {
  const [mode, setMode] = useState<InstallHintMode>(null);
  const controllerRef = useRef<ReturnType<
    typeof createInstallHintController
  > | null>(null);

  const hide = useCallback(() => {
    controllerRef.current?.hide();
  }, []);

  useEffect(() => {
    const controller = createInstallHintController({
      surface,
      runtime: createBrowserInstallHintRuntime(),
      onModeChange: setMode,
      startsUnlocked: surface !== "customer",
    });
    controllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [surface]);

  useEffect(() => {
    if (surface !== "customer" || unlocked) controllerRef.current?.unlock();
  }, [surface, unlocked]);

  const install = useCallback(async () => {
    await controllerRef.current?.install();
  }, []);

  if (!mode) return null;

  const dark = variant === "dark";

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed inset-x-0 top-0 z-[90] px-3 pt-[max(10px,env(safe-area-inset-top))]",
        "motion-safe:animate-[installhint_240ms_ease-out]",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border px-4 py-3 shadow-brand-soft",
          dark
            ? "border-white/12 bg-[#171310]/95 text-white/90 backdrop-blur"
            : "border-hairline bg-surface-card/95 text-ink backdrop-blur",
        ].join(" ")}
      >
        <Image
          src="/pwa/icon-192.png"
          alt=""
          width={192}
          height={192}
          className="h-9 w-9 flex-none rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-body-sm font-semibold">
            Install {appName}
          </p>
          <p
            className={[
              "font-body text-caption",
              dark ? "text-white/55" : "text-muted",
            ].join(" ")}
          >
            {surface === "customer"
              ? mode === "ios"
                ? "Save restaurants and updates: tap Share, then Add to Home Screen."
                : "Keep saved restaurants and menu updates in one place."
              : mode === "ios"
                ? "Tap Share, then \u201CAdd to Home Screen\u201D."
                : "Add it to your home screen for quick access."}
          </p>
        </div>
        {mode === "prompt" ? (
          <button
            type="button"
            onClick={install}
            className={[
              "flex-none rounded-pill px-4 py-2 font-body text-caption font-semibold transition-colors",
              dark
                ? "bg-[#f5a623] text-[#1a1205] hover:bg-[#ffd24c]"
                : "bg-ink text-white hover:bg-black",
            ].join(" ")}
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={hide}
          aria-label="Dismiss install hint"
          className={[
            "flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg leading-none transition-colors",
            dark
              ? "text-white/45 hover:bg-white/10 hover:text-white"
              : "text-muted hover:bg-black/5 hover:text-ink",
          ].join(" ")}
        >
          ×
        </button>
      </div>
    </div>
  );
}
