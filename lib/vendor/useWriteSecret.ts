"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zantap:vendor-write-secret";

export function useWriteSecret() {
  const [secret, setSecretState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setSecretState(localStorage.getItem(STORAGE_KEY));
    } catch {
      setSecretState(null);
    }
    setReady(true);
  }, []);

  const setSecret = useCallback((value: string) => {
    const trimmed = value.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore quota / private-mode failures
    }
    setSecretState(trimmed || null);
  }, []);

  const clearSecret = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSecretState(null);
  }, []);

  return { secret, setSecret, clearSecret, ready, hasSecret: !!secret };
}
