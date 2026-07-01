"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Per-vendor owner token cache (ADR-0022). The token is minted server-side at
 * provision (or re-issued by recovery), returned to the browser exactly once,
 * and stored here keyed by slug — so it is NEVER typed and this hook NEVER
 * prompts. Multiple vendors on one device each keep their own token.
 */

const STORAGE_PREFIX = "zantap:owner-token:";

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
}

export function useOwnerToken(vendorSlug: string) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    try {
      setTokenState(localStorage.getItem(ownerTokenStorageKey(vendorSlug)));
    } catch {
      setTokenState(null);
    }
    setReady(true);
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
