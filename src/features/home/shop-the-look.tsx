"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { formatPrice } from "@/utils/format";
import type { ProductSummary } from "@/types/domain";
import { cn } from "@/utils/cn";

type LookItem = { product: ProductSummary; hotspot: { x: number; y: number } };

/** Pick a sensible default variant (size M, else first in stock) for "add all". */
function defaultVariant(p: ProductSummary) {
  const inStock = p.variants.filter((v) => v.stock > 0);
  return inStock.find((v) => v.size === "M") ?? inStock[0] ?? null;
}

export function ShopTheLook({ title, text, image, alt, items }: { title: string; text: string; image: string; alt: string; items: LookItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const { addItem, open } = useCart();
  const toast = useToast();
  const [pending, start] = useTransition();
  const available = items.filter((i) => i.product.inStock);
  // Only what "Add All" can actually put in the bag.
  const total = available.reduce((s, i) => s + i.product.price, 0);

  const addAll = () =>
    start(async () => {
      let added = 0;
      const sizes = new Set<string>();
      for (const { product } of available) {
        const v = defaultVariant(product);
        if (await addItem({ productId: product.id, variantId: v?.id ?? null, quantity: 1 }, { openDrawer: false, silent: true })) {
          added++;
          if (v?.size && v.size !== "One Size") sizes.add(v.size);
        }
      }
      // One summary toast instead of one per piece.
      if (added) {
        const size = sizes.size === 1 ? ` in size ${[...sizes][0]}` : "";
        toast({ message: `${added === 1 ? "1 piece" : `${added} pieces`} added${size} — adjust sizes in your bag`, action: { label: "View bag", onClick: open } });
      }
    });

  return (
    <section aria-labelledby="look-heading" className="bg-cream py-16 md:py-24 xl:py-32">
      <div className="container-site grid items-center gap-10 md:grid-cols-12 md:gap-6">
        <div className="relative -mx-4 aspect-[4/5] overflow-hidden md:col-span-6 md:mx-0 lg:col-span-7">
          <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 56vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
          {items.map(({ product, hotspot }, i) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              onMouseEnter={() => setActive(product.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(product.id)}
              onBlur={() => setActive(null)}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              aria-label={`${i + 1}: ${product.name}, ${formatPrice(product.price)}${product.inStock ? "" : ", sold out"}`}
            >
              <span
                className={cn(
                  "relative grid size-9 place-items-center rounded-full bg-ivory/95 font-ui text-[12px] font-medium shadow-[var(--shadow-soft)] transition-all duration-300 group-hover:scale-110 group-hover:bg-charcoal group-hover:text-ivory",
                  "after:absolute after:-inset-1.5 after:animate-ping after:rounded-full after:border after:border-ivory/70 after:[animation-duration:2.4s] motion-reduce:after:hidden",
                  active === product.id && "scale-110 bg-charcoal text-ivory",
                )}
              >
                {i + 1}
              </span>
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute left-12 top-1/2 hidden w-max -translate-y-1/2 bg-ivory px-4 py-3 shadow-[var(--shadow-soft)] transition-opacity duration-300 md:block",
                  active === product.id ? "opacity-100" : "opacity-0",
                )}
              >
                <span className="block font-ui text-[14px] font-medium">{product.name}</span>
                <span className="font-ui text-[13px] text-ink-2">{formatPrice(product.price)}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="md:col-span-6 md:pl-4 lg:col-span-4 lg:col-start-9 lg:pl-0">
          <p className="eyebrow">Shop the Look</p>
          <h2 id="look-heading" className="mt-4 font-display text-[34px] leading-[1.1] md:text-[44px]">
            {title}
          </h2>
          <p className="mt-4 text-ink-2">{text}</p>
          <ul className="mt-8">
            {items.map(({ product }, i) => (
              <li
                key={product.id}
                onMouseEnter={() => setActive(product.id)}
                onMouseLeave={() => setActive(null)}
                className={cn("grid grid-cols-[22px_88px_1fr] items-center gap-4 border-t border-line py-4 transition-colors max-md:grid-cols-[80px_1fr]", active === product.id && "bg-blush/60")}
              >
                <span className="self-start pt-1 font-ui text-[13px] text-ink-3 max-md:hidden">0{i + 1}</span>
                <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-beige">
                  {product.images[0] && <Image src={product.images[0].url} alt={product.images[0].alt} fill sizes="88px" className="object-cover" />}
                </Link>
                <div>
                  <p className="font-ui text-[15px] font-medium">{product.name}</p>
                  <p className="font-ui text-[13px] text-ink-3">{product.category?.name}</p>
                  <p className="mt-1.5 font-ui text-[15px]">{formatPrice(product.price)}</p>
                  {!product.inStock && <p className="font-ui text-[12px] uppercase tracking-[0.12em] text-sale">Sold out</p>}
                  <Link href={`/product/${product.slug}`} className="link-underline ui-label mt-2 inline-flex items-center gap-2 text-[11px]">
                    View Product <ArrowRight className="size-3.5" strokeWidth={1.4} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {/* Side by side only at xl: the column is too narrow for both at md/lg. */}
          <div className="flex flex-col gap-4 border-t border-line pt-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="eyebrow">Complete look</p>
              <p className="mt-1.5 whitespace-nowrap font-ui text-[22px] tracking-[0.02em]">{available.length ? formatPrice(total) : "Sold out"}</p>
            </div>
            <Button onClick={addAll} loading={pending} disabled={!available.length} className="max-xl:w-full">
              Add All to Bag
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
