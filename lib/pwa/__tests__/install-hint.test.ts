import { describe, expect, it, vi } from "vitest";
import {
  createInstallHintController,
  type InstallHintRuntime,
} from "@/lib/pwa/install-hint";

class FakeInstallHintRuntime implements InstallHintRuntime {
  standalone = false;
  ios = false;
  readonly seen = new Set<string>();
  readonly listeners = new Map<string, Set<(event: Event) => void>>();
  readonly timers = new Map<number, { callback: () => void; delayMs: number }>();
  private nextTimerId = 1;

  isStandalone() {
    return this.standalone;
  }

  isIosSafariLike() {
    return this.ios;
  }

  hasSeen(surface: string) {
    return this.seen.has(surface);
  }

  markSeen(surface: string) {
    this.seen.add(surface);
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: Event) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  setTimeout(callback: () => void, delayMs: number) {
    const id = this.nextTimerId++;
    this.timers.set(id, { callback, delayMs });
    return id;
  }

  clearTimeout(timerId: number) {
    this.timers.delete(timerId);
  }

  emit(type: string, event: Event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  runTimer(delayMs: number) {
    const match = [...this.timers.entries()].find(
      ([, timer]) => timer.delayMs === delayMs
    );
    if (!match) throw new Error(`No timer scheduled for ${delayMs}ms`);
    const [id, timer] = match;
    this.timers.delete(id);
    timer.callback();
  }
}

describe("InstallHintBanner behavior", () => {
  it("shows an eligible browser prompt once and records the storefront surface", () => {
    const runtime = new FakeInstallHintRuntime();
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "storefront",
      runtime,
      onModeChange,
    });
    const promptEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    const preventDefault = vi.spyOn(promptEvent, "preventDefault");

    controller.start();
    runtime.emit("beforeinstallprompt", promptEvent);
    runtime.emit("beforeinstallprompt", promptEvent);

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith("prompt");
    expect(runtime.seen).toContain("storefront");
  });

  it("auto-hides the browser prompt after five seconds", () => {
    const runtime = new FakeInstallHintRuntime();
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "kds",
      runtime,
      onModeChange,
    });
    const promptEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "dismissed" as const }),
    });

    controller.start();
    runtime.emit("beforeinstallprompt", promptEvent);
    runtime.runTimer(5000);

    expect(onModeChange).toHaveBeenNthCalledWith(1, "prompt");
    expect(onModeChange).toHaveBeenNthCalledWith(2, null);
  });

  it("opens the captured install prompt and hides after the choice", async () => {
    const runtime = new FakeInstallHintRuntime();
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "storefront",
      runtime,
      onModeChange,
    });
    const prompt = vi.fn(async () => undefined);
    const promptEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });

    controller.start();
    runtime.emit("beforeinstallprompt", promptEvent);
    await controller.install();

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenLastCalledWith(null);
    expect(runtime.timers.size).toBe(0);
  });

  it("shows iOS home-screen instructions after page settle, then auto-hides", () => {
    const runtime = new FakeInstallHintRuntime();
    runtime.ios = true;
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "kds",
      runtime,
      onModeChange,
    });

    controller.start();
    expect(onModeChange).not.toHaveBeenCalled();

    runtime.runTimer(1200);
    expect(onModeChange).toHaveBeenCalledWith("ios");
    expect(runtime.seen).toContain("kds");

    runtime.runTimer(8000);
    expect(onModeChange).toHaveBeenLastCalledWith(null);
  });

  it("hides immediately when the browser reports installation completed", () => {
    const runtime = new FakeInstallHintRuntime();
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "storefront",
      runtime,
      onModeChange,
    });
    const promptEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });

    controller.start();
    runtime.emit("beforeinstallprompt", promptEvent);
    runtime.emit("appinstalled", new Event("appinstalled"));

    expect(onModeChange).toHaveBeenLastCalledWith(null);
    expect(runtime.timers.size).toBe(0);
  });

  it("allows the visitor to dismiss the visible hint", () => {
    const runtime = new FakeInstallHintRuntime();
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "kds",
      runtime,
      onModeChange,
    });
    const promptEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "dismissed" as const }),
    });

    controller.start();
    runtime.emit("beforeinstallprompt", promptEvent);
    controller.hide();

    expect(onModeChange).toHaveBeenLastCalledWith(null);
    expect(runtime.timers.size).toBe(0);
  });

  it("does not register or show a hint while already installed", () => {
    const runtime = new FakeInstallHintRuntime();
    runtime.standalone = true;
    const onModeChange = vi.fn();
    const controller = createInstallHintController({
      surface: "storefront",
      runtime,
      onModeChange,
    });

    controller.start();

    expect(runtime.listeners.size).toBe(0);
    expect(runtime.timers.size).toBe(0);
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it("suppresses a seen surface without suppressing the other app surface", () => {
    const runtime = new FakeInstallHintRuntime();
    runtime.seen.add("kds");
    const onKdsModeChange = vi.fn();
    const onStorefrontModeChange = vi.fn();
    const kdsController = createInstallHintController({
      surface: "kds",
      runtime,
      onModeChange: onKdsModeChange,
    });
    const storefrontController = createInstallHintController({
      surface: "storefront",
      runtime,
      onModeChange: onStorefrontModeChange,
    });
    const promptEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });

    kdsController.start();
    storefrontController.start();
    runtime.emit("beforeinstallprompt", promptEvent);

    expect(onKdsModeChange).not.toHaveBeenCalled();
    expect(onStorefrontModeChange).toHaveBeenCalledWith("prompt");
    expect(runtime.seen).toEqual(new Set(["kds", "storefront"]));
  });
});
