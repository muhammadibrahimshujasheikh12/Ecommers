"use client";

import { useEffect, useState } from "react";
import type { SearchSuggestions } from "@/lib/data/catalog";
import type { MiniProduct } from "./mini-product-card";

// One request per page session, shared by the search overlay and the bag
// drawer. The response is also browser-cacheable (see /api/search).
let pending: Promise<MiniProduct[]> | null = null;

function loadTrending(): Promise<MiniProduct[]> {
  pending ??= fetch("/api/search?trending=1")
    .then(async (res) => {
      if (!res.ok) throw new Error(String(res.status));
      return ((await res.json()) as SearchSuggestions).products;
    })
    .catch(() => {
      pending = null; // allow a retry on the next open
      return [];
    });
  return pending;
}

/**
 * Four best sellers for idle and empty states in client-driven UI. Loads
 * lazily the first time `enabled` is true; `null` while loading, `[]` if
 * unavailable (callers hide the block).
 */
export function useTrendingProducts(enabled: boolean): MiniProduct[] | null {
  const [products, setProducts] = useState<MiniProduct[] | null>(null);
  // Forget an empty result once the UI closes, so the next open asks again: after a
  // failed request that fetches anew, while a successful load resolves from `pending`.
  if (!enabled && products?.length === 0) setProducts(null);

  useEffect(() => {
    if (!enabled || products) return;
    let cancelled = false;
    loadTrending().then((p) => {
      if (!cancelled) setProducts(p);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, products]);

  return products;
}
