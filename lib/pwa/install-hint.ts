export type InstallHintMode = "prompt" | "ios" | null;
export type InstallHintSurface = "customer" | "storefront" | "kds";

const AUTO_HIDE_PROMPT_MS = 5000;
const AUTO_HIDE_IOS_MS = 8000;
const IOS_SETTLE_MS = 1200;

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Browser operations used by the install-hint lifecycle. */
export interface InstallHintRuntime {
  isStandalone(): boolean;
  isIosSafariLike(): boolean;
  hasSeen(surface: InstallHintSurface): boolean;
  markSeen(surface: InstallHintSurface): void;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
  setTimeout(callback: () => void, delayMs: number): number;
  clearTimeout(timerId: number): void;
}

function storageKey(surface: InstallHintSurface) {
  return `zantap.install-hint.${surface}`;
}

/** Browser adapter for the install-hint lifecycle seam. */
export function createBrowserInstallHintRuntime(): InstallHintRuntime {
  return {
    isStandalone() {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      return (
        window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
        nav.standalone === true
      );
    },
    isIosSafariLike() {
      const ua = window.navigator.userAgent;
      return (
        /iPhone|iPad|iPod/i.test(ua) ||
        (/Macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1)
      );
    },
    hasSeen(surface) {
      try {
        return window.localStorage.getItem(storageKey(surface)) !== null;
      } catch {
        // Private/restricted storage still permits one hint in this pageview.
        return false;
      }
    },
    markSeen(surface) {
      try {
        window.localStorage.setItem(
          storageKey(surface),
          new Date().toISOString()
        );
      } catch {
        // The controller's in-memory guard still prevents duplicates.
      }
    },
    addEventListener(type, listener) {
      window.addEventListener(type, listener);
    },
    removeEventListener(type, listener) {
      window.removeEventListener(type, listener);
    },
    setTimeout(callback, delayMs) {
      return window.setTimeout(callback, delayMs);
    },
    clearTimeout(timerId) {
      window.clearTimeout(timerId);
    },
  };
}

interface InstallHintControllerOptions {
  surface: InstallHintSurface;
  runtime: InstallHintRuntime;
  onModeChange(mode: InstallHintMode): void;
  startsUnlocked?: boolean;
}

/**
 * Owns the install prompt lifecycle while the React banner remains a thin view.
 * Tests and the UI exercise this same interface.
 */
export function createInstallHintController({
  surface,
  runtime,
  onModeChange,
  startsUnlocked = true,
}: InstallHintControllerOptions) {
  let shown = false;
  let unlocked = startsUnlocked;
  let hideTimerId: number | null = null;
  let iosTimerId: number | null = null;
  let promptEvent: InstallPromptEvent | null = null;

  const hide = () => {
    if (hideTimerId !== null) runtime.clearTimeout(hideTimerId);
    hideTimerId = null;
    onModeChange(null);
  };

  const show = (mode: Exclude<InstallHintMode, null>, autoHideMs: number) => {
    if (shown || !unlocked) return;
    shown = true;
    runtime.markSeen(surface);
    onModeChange(mode);
    hideTimerId = runtime.setTimeout(hide, autoHideMs);
  };

  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    promptEvent = event as InstallPromptEvent;
    show("prompt", AUTO_HIDE_PROMPT_MS);
  };

  const scheduleIosHint = () => {
    if (iosTimerId !== null || shown || !unlocked) return;
    iosTimerId = runtime.setTimeout(() => {
      iosTimerId = null;
      show("ios", AUTO_HIDE_IOS_MS);
    }, IOS_SETTLE_MS);
  };

  return {
    start() {
      if (runtime.isStandalone() || runtime.hasSeen(surface)) return;
      runtime.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      runtime.addEventListener("appinstalled", hide);
      if (runtime.isIosSafariLike()) scheduleIosHint();
    },
    stop() {
      runtime.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      runtime.removeEventListener("appinstalled", hide);
      if (iosTimerId !== null) runtime.clearTimeout(iosTimerId);
      if (hideTimerId !== null) runtime.clearTimeout(hideTimerId);
    },
    unlock() {
      if (unlocked) return;
      unlocked = true;
      if (promptEvent) show("prompt", AUTO_HIDE_PROMPT_MS);
      else if (runtime.isIosSafariLike()) scheduleIosHint();
    },
    hide,
    async install() {
      const event = promptEvent;
      if (!event) return;
      promptEvent = null;
      try {
        await event.prompt();
        await event.userChoice;
      } finally {
        hide();
      }
    },
  };
}
