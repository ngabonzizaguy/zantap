"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Per-vendor owner token cache (ADR-0022). The token is minted server-side at
 * provision (or re-issued by recovery), returned to the browser exactly once,
 * and stored here keyed by slug — so it is NEVER typed and this hook NEVER
 * prompts. Multiple vendors on one device each keep their own token.
 */

const STORAGE_PREFIX = "zantap:owner-token:";
const OWNER_ACCESS_EVENT = "zantap:owner-access-changed";

export function ownerTokenStorageKey(vendorSlug: string): string {
  return `${STORAGE_PREFIX}${vendorSlug}`;
}

/**
 * Write a freshly minted/recovered token to the cache. Exported as a plain
 * function (not a hook) so non-hook flows — the provision success step, the
 * recovery form — can persist the token before any component reads it.
 */
export function cacheOwnerToken(vendorSlug: string, token: string): void {
  try {
    if (token) {
      localStorage.setItem(ownerTokenStorageKey(vendorSlug), token);
    } else {
      localStorage.removeItem(ownerTokenStorageKey(vendorSlug));
    }
  } catch {
    // ignore quota / private-mode failures
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OWNER_ACCESS_EVENT, { detail: { vendorSlug } })
    );
  }
}

/** Move a cached owner token when a vendor renames their storefront slug. */
export function transferOwnerTokenCache(fromSlug: string, toSlug: string): void {
  if (fromSlug === toSlug) return;
  try {
    const token = localStorage.getItem(ownerTokenStorageKey(fromSlug));
    if (!token) return;
    localStorage.setItem(ownerTokenStorageKey(toSlug), token);
    localStorage.removeItem(ownerTokenStorageKey(fromSlug));
  } catch {
    // ignore quota / private-mode failures
  }
}

export function useOwnerToken(vendorSlug: string) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is client-only external state; reading it during render would
    // break SSR hydration, so the sync read must live in an effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    setReady(false);
    try {
      setTokenState(localStorage.getItem(ownerTokenStorageKey(vendorSlug)));
    } catch {
      setTokenState(null);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [vendorSlug]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ vendorSlug?: string }>).detail;
      if (detail?.vendorSlug && detail.vendorSlug !== vendorSlug) return;
      try {
        setTokenState(localStorage.getItem(ownerTokenStorageKey(vendorSlug)));
      } catch {
        setTokenState(null);
      }
    };
    window.addEventListener(OWNER_ACCESS_EVENT, refresh);
    return () => window.removeEventListener(OWNER_ACCESS_EVENT, refresh);
  }, [vendorSlug]);

  const setToken = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      cacheOwnerToken(vendorSlug, trimmed);
      setTokenState(trimmed || null);
    },
    [vendorSlug]
  );

  const clearToken = useCallback(() => {
    cacheOwnerToken(vendorSlug, "");
    setTokenState(null);
  }, [vendorSlug]);

  return { token, setToken, clearToken, ready, hasToken: !!token };
}
