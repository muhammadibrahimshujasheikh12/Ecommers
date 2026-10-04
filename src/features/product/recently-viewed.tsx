"use client";

import { useEffect, useState } from "react";
import { recentlyViewedStore } from "@/stores/local";
import { getProductsAction } from "@/features/wishlist/actions";
import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/types/domain";

/** Records the current product and lists the shopper's other recently viewed pieces. */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const ids = recentlyViewedStore.useStore();
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    const current = recentlyViewedStore.get();
    recentlyViewedStore.set([currentId, ...current.filter((id) => id !== currentId)].slice(0, 12));
  }, [currentId]);

  const others = ids.filter((id) => id !== currentId).slice(0, 4);
  const key = others.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getProductsAction(key.split(",")).then((p) => {
      if (!cancelled) setProducts(p);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const visible = key ? products.filter((p) => others.includes(p.id)) : [];
  if (!visible.length) return null;
  return (
    <section aria-labelledby="recent-heading" className="border-t border-line py-16 md:py-24">
      <h2 id="recent-heading" className="heading-section mb-8 md:mb-12">
        Recently Viewed
      </h2>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-4 md:gap-x-6">
        {visible.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
