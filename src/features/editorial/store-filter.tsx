"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type FilterItem = { key: string; city: string; node: ReactNode };

/**
 * City filter chips for the store locator. Store cards are rendered on the
 * server and passed in as nodes; without JavaScript every store stays visible.
 */
export function StoreFilter({ items }: { items: FilterItem[] }) {
  const [city, setCity] = useState<string | null>(null);
  const cities = [...new Set(items.map((i) => i.city))];
  const visible = city ? items.filter((i) => i.city === city) : items;
  const options = [{ value: null, label: "All cities", count: items.length }, ...cities.map((c) => ({ value: c, label: c, count: items.filter((i) => i.city === c).length }))];

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between md:pb-8">
        <div role="group" aria-label="Filter boutiques by city" className="scrollbar-none -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2">
            {options.map((o) => {
              const active = city === o.value;
              return (
                <li key={o.label} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCity(o.value)}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full border px-5 font-ui text-[13px] tracking-[0.04em] transition-colors",
                      active ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/25 hover:border-charcoal",
                    )}
                  >
                    {o.label}
                    <span aria-hidden className={cn("text-[12px]", active ? "text-ivory/70" : "text-ink-3")}>
                      {o.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <p aria-live="polite" className="font-ui text-[13px] tracking-[0.04em] text-ink-2">
          Showing {visible.length} {visible.length === 1 ? "boutique" : "boutiques"}
          {city ? ` in ${city}` : ""}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {visible.map((i) => (
          <li key={i.key} className="group py-12 md:py-16 xl:py-20">
            {i.node}
          </li>
        ))}
      </ul>
    </>
  );
}
