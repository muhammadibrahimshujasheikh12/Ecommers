"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny cross-tab store backed by localStorage, read with
 * useSyncExternalStore (no hydration mismatch: the server snapshot is the
 * empty default). Every access is guarded — storage can be unavailable in
 * private mode or when blocked.
 */
export function createLocalStore<T>(key: string, fallback: T, validate: (v: unknown) => T) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } | null = null;

  const read = (): T => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (cache && cache.raw === raw) return cache.value;
    let value = fallback;
    try {
      value = raw ? validate(JSON.parse(raw)) : fallback;
    } catch {
      value = fallback;
    }
    cache = { raw, value };
    return value;
  };

  const write = (value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked — keep working in memory for this session.
      cache = { raw: JSON.stringify(value), value };
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  function useStore(): T {
    return useSyncExternalStore(subscribe, read, () => fallback);
  }

  return { useStore, get: read, set: write };
}

export const idList = (max: number) => (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, max) : [];
