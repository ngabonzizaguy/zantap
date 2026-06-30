"use client";

import { useCallback, useEffect, useState } from "react";

export const PROVISION_SECRET_STORAGE_KEY = "zantap:provision-secret";

export function useProvisionSecret() {
  const [secret, setSecretState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setSecretState(sessionStorage.getItem(PROVISION_SECRET_STORAGE_KEY));
    } catch {
      setSecretState(null);
    }
    setReady(true);
  }, []);

  const setSecret = useCallback((value: string) => {
    const trimmed = value.trim();
    try {
      if (trimmed) {
        sessionStorage.setItem(PROVISION_SECRET_STORAGE_KEY, trimmed);
      } else {
        sessionStorage.removeItem(PROVISION_SECRET_STORAGE_KEY);
      }
    } catch {
      // ignore quota / private-mode failures
    }
    setSecretState(trimmed || null);
  }, []);

  const clearSecret = useCallback(() => {
    try {
      sessionStorage.removeItem(PROVISION_SECRET_STORAGE_KEY);
    } catch {
      // ignore
    }
    setSecretState(null);
  }, []);

  return { secret, setSecret, clearSecret, ready, hasSecret: !!secret };
}
