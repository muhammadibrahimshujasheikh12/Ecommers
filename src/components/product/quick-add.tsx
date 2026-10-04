"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useCart } from "@/features/cart/cart-provider";
import { formatPrice } from "@/utils/format";
import type { ProductSummary, VariantOption } from "@/types/domain";
import { cn } from "@/utils/cn";

/** Size options for the first colour (the card shows the primary colourway). */
function sizeOptions(product: ProductSummary): VariantOption[] {
  const color = product.colors[0]?.name ?? null;
  return product.variants.filter((v) => v.color === color);
}

export function QuickAdd({ product }: { product: ProductSummary }) {
  const { addItem } = useCart();
  const [pending, start] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const options = sizeOptions(product);
  const single = product.variants.length <= 1;

  const add = (variant: VariantOption | null) =>
    start(async () => {
      const ok = await addItem({ productId: product.id, variantId: variant?.id ?? null, quantity: 1 }, { openDrawer: false });
      if (ok) {
        setAddedId(variant?.id ?? "single");
        setSheetOpen(false);
        window.setTimeout(() => setAddedId(null), 1200);
      }
    });

  return (
    <>
      {/* Desktop: reveal on hover / keyboard focus */}
      <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 bg-ivory/95 p-3 opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 md:block">
        {single ? (
          <button
            type="button"
            onClick={() => add(product.variants[0] ?? null)}
            disabled={pending}
            className="h-10 w-full font-ui text-[12px] font-medium uppercase tracking-[0.18em] hover:bg-charcoal hover:text-ivory"
          >
            {addedId ? "Added" : "Quick Add"}
          </button>
        ) : (
          <>
            <p className="mb-2 text-center font-ui text-[12px] font-medium uppercase tracking-[0.18em]">Quick Add</p>
            <div className="grid grid-cols-5 gap-1" role="group" aria-label={`Add ${product.name} — choose a size`}>
              {options.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={pending || v.stock <= 0}
                  onClick={() => add(v)}
                  aria-label={`Add size ${v.size} to bag${v.stock <= 0 ? " (sold out)" : ""}`}
                  className={cn(
                    "h-9 border border-transparent font-ui text-[13px] tracking-[0.06em] transition-colors hover:border-charcoal disabled:text-ink-3/60 disabled:line-through disabled:hover:border-transparent",
                    addedId === v.id && "bg-charcoal text-ivory",
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Touch: 44px target opens a size sheet */}
      <button
        type="button"
        onClick={() => (single ? add(product.variants[0] ?? null) : setSheetOpen(true))}
        disabled={pending}
        aria-label={`Quick add ${product.name}`}
        className="absolute bottom-2 right-2 z-10 grid size-11 place-items-center rounded-full bg-ivory text-charcoal shadow-[0_1px_2px_rgb(42_40_38/0.08)] md:hidden"
      >
        <Plus className={cn("size-[18px] transition-transform", pending && "rotate-90")} strokeWidth={1.5} />
      </button>

      {!single && (
        <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} side="bottom" title="Select size">
          <div className="px-5 pb-8 pt-5">
            <p className="font-ui text-[15px] font-medium">{product.name}</p>
            <p className="mb-5 font-ui text-[14px] text-ink-2">{formatPrice(product.price)}</p>
            <div className="grid grid-cols-5 gap-2">
              {options.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={pending || v.stock <= 0}
                  onClick={() => add(v)}
                  className="h-12 border border-line-strong font-ui text-[14px] disabled:text-ink-3/60 disabled:line-through"
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}
