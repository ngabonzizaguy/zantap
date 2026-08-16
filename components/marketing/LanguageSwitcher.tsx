"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

/**
 * Masthead language switcher. All four locales are live: baseline rw/fr/sw
 * dictionaries ship in-repo (lib/i18n/translations) and the owner overrides
 * any string from Ops → Settings → Languages. Selection persists to a cookie
 * (read server-side so the page SSRs in the chosen language) plus
 * localStorage, and reloads the page to re-render.
 */

const STORAGE_KEY = "zantap.lang";

const LOCALES = SUPPORTED_LOCALES.map((locale) => ({
  ...locale,
  ready: true,
}));

type LocaleCode = Locale;

/* Tiny external store over localStorage so the stored language hydrates
   safely (server snapshot is always "en"). */
const langListeners = new Set<() => void>();
const subscribeLang = (cb: () => void) => {
  langListeners.add(cb);
  return () => langListeners.delete(cb);
};
const readLang = (): LocaleCode => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const match = LOCALES.find((l) => l.code === stored);
  return match ? match.code : "en";
};
const writeLang = (code: LocaleCode) => {
  window.localStorage.setItem(STORAGE_KEY, code);
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.setAttribute("lang", code);
  langListeners.forEach((cb) => cb());
};

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "en");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const select = (code: LocaleCode, ready: boolean) => {
    if (!ready) return;
    const changed = code !== lang;
    writeLang(code);
    setOpen(false);
    // The page is server-rendered in the cookie's language — reload to apply.
    if (changed) window.location.reload();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-pill border border-white/15 bg-white/5 px-3 font-body text-caption uppercase text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        {/* Globe */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-4 w-4"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a13.4 13.4 0 0 1 0 18M12 3a13.4 13.4 0 0 0 0 18" />
        </svg>
        {lang}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#171310] py-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang === l.code}
                disabled={!l.ready}
                onClick={() => select(l.code, l.ready)}
                className={
                  l.ready
                    ? "flex w-full items-center justify-between px-4 py-2.5 text-left font-body text-body-sm text-white/85 transition-colors hover:bg-white/[0.06]"
                    : "flex w-full cursor-default items-center justify-between px-4 py-2.5 text-left font-body text-body-sm text-white/35"
                }
              >
                {l.label}
                {lang === l.code ? (
                  <span aria-hidden className="text-[#f5a623]">
                    ✓
                  </span>
                ) : !l.ready ? (
                  <span className="rounded-pill bg-white/[0.07] px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-white/40">
                    Soon
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
