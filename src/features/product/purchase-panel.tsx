"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { GitCompareArrows, Minus, Plus, Ruler, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Price, Stars } from "@/components/ui/misc";
import { Drawer } from "@/components/ui/drawer";
import { WishlistButton } from "@/components/product/wishlist-button";
import { useCart } from "@/features/cart/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COMPARE_LIMIT, compareStore } from "@/stores/local";
import { sizeGuide } from "@/content/size-guide";
import { site } from "@/content/site";
import { formatPrice } from "@/utils/format";
import type { ProductDetail } from "@/types/domain";
import { cn } from "@/utils/cn";

const LOW_STOCK = 3;

export function SizeGuideTable() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse font-ui text-[14px]">
          <caption className="sr-only">Size guide in inches</caption>
          <thead>
            <tr>
              {sizeGuide.columns.map((c) => (
                <th key={c} scope="col" className="border-b border-charcoal py-3 pr-4 text-left text-[12px] font-medium uppercase tracking-[0.12em]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeGuide.rows.map((r) => (
              <tr key={r[0]}>
                {r.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="border-b border-line py-3 pr-4 text-left font-medium">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="border-b border-line py-3 pr-4 text-ink-2">
                      {cell}″
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] text-ink-2">{sizeGuide.note}</p>
    </div>
  );
}

export function PurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();
  const compare = compareStore.useStore();
  const [color, setColor] = useState<string | null>(product.colors[0]?.name ?? null);
  const hasSizes = product.sizes.length > 0 && !(product.sizes.length === 1 && product.sizes[0] === "One Size");
  const [size, setSize] = useState<string | null>(hasSizes ? null : (product.sizes[0] ?? null));
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [pending, start] = useTransition();
  const [showSticky, setShowSticky] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const variantsForColor = useMemo(() => product.variants.filter((v) => !color || v.color === color), [product.variants, color]);
  const selected = product.variants.length
    ? (variantsForColor.find((v) => v.size === size) ?? (variantsForColor.length === 1 ? variantsForColor[0] : null))
    : null;
  const stock = selected ? selected.stock : product.variants.length ? variantsForColor.reduce((n, v) => n + v.stock, 0) : product.inStock ? 99 : 0;
  const price = selected?.price ?? product.price;
  const soldOut = !product.inStock || (selected ? selected.stock <= 0 : variantsForColor.every((v) => v.stock <= 0));
  const inCompare = compare.includes(product.id);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = (thenCheckout: boolean) => {
    if (product.variants.length > 1 && !selected) {
      setSizeError(true);
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    start(async () => {
      const ok = await addItem({ productId: product.id, variantId: selected?.id ?? product.variants[0]?.id ?? null, quantity: qty }, { openDrawer: !thenCheckout });
      if (ok && thenCheckout) router.push("/checkout");
    });
  };

  const toggleCompare = () => {
    if (inCompare) {
      compareStore.set(compare.filter((id) => id !== product.id));
      toast({ message: `${product.name} removed from compare` });
    } else if (compare.length >= COMPARE_LIMIT) {
      toast({ tone: "error", message: `You can compare up to ${COMPARE_LIMIT} products.`, action: { label: "Compare", href: "/compare" } });
    } else {
      compareStore.set([...compare, product.id]);
      toast({ message: `${product.name} added to compare`, action: { label: "Compare now", href: "/compare" } });
    }
  };

  return (
    <div>
      <p className="eyebrow">{product.category?.name}</p>
      <h1 className="mt-3 font-display text-[34px] leading-[1.08] md:text-[44px]">{product.name}</h1>
      {product.ratingCount > 0 && (
        <a href="#reviews" className="mt-3 inline-flex items-center gap-2 font-ui text-[13px] text-ink-2 hover:text-charcoal">
          <Stars value={product.rating} size={13} />
          {product.rating.toFixed(1)} · {product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"}
        </a>
      )}
      <Price price={price} compareAt={product.compareAtPrice} size="lg" className="mt-5" />
      <p className="mt-1 text-[13px] text-ink-3">Inclusive of all taxes. Shipping calculated at checkout.</p>
      {product.shortDescription && <p className="mt-6 text-ink-2">{product.shortDescription}</p>}

      {product.colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="font-ui text-[13px] font-medium uppercase tracking-[0.14em]">
            Colour: <span className="font-normal normal-case tracking-[0.02em] text-ink-2">{color}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setColor(c.name);
                  setSizeError(false);
                }}
                aria-pressed={color === c.name}
                aria-label={c.name}
                title={c.name}
                className={cn("size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(42_40_38/0.15)] transition-[outline-color]", color === c.name ? "outline outline-1 outline-offset-[3px] outline-charcoal" : "outline outline-1 outline-offset-[3px] outline-transparent hover:outline-line-strong")}
                style={{ backgroundColor: c.hex ?? "#ddd" }}
              />
            ))}
          </div>
        </fieldset>
      )}

      {hasSizes && (
        <fieldset className="mt-8" aria-describedby={sizeError ? "size-error" : undefined}>
          <div className="flex items-center justify-between">
            <legend className="font-ui text-[13px] font-medium uppercase tracking-[0.14em]">
              Size{size && <span className="font-normal normal-case tracking-[0.02em] text-ink-2">: {size}</span>}
            </legend>
            <button type="button" onClick={() => setGuideOpen(true)} className="inline-flex items-center gap-1.5 font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
              <Ruler className="size-4" strokeWidth={1.3} /> Size guide
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
            {product.sizes.map((s) => {
              const v = variantsForColor.find((x) => x.size === s);
              const out = !v || v.stock <= 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                    setQty(1);
                  }}
                  disabled={out}
                  aria-pressed={size === s}
                  aria-label={`${s}${out ? " — sold out" : v.stock <= LOW_STOCK ? ` — only ${v.stock} left` : ""}`}
                  className={cn(
                    "relative h-12 min-w-14 border px-4 font-ui text-[14px] tracking-[0.06em] transition-colors",
                    size === s ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong hover:border-charcoal",
                    out && "cursor-not-allowed border-line text-ink-3/60 line-through hover:border-line",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {sizeError && (
            <p id="size-error" role="alert" className="mt-3 text-[13px] text-sale">
              Please select a size.
            </p>
          )}
        </fieldset>
      )}

      <p className={cn("mt-6 flex items-center gap-2 font-ui text-[14px]", soldOut ? "text-sale" : stock <= LOW_STOCK ? "text-warning" : "text-success")} role="status">
        <span className={cn("size-2 rounded-full", soldOut ? "bg-sale" : stock <= LOW_STOCK ? "bg-[#c28a2c]" : "bg-success")} aria-hidden />
        {soldOut ? (selected ? "This size is sold out" : "Sold out") : stock <= LOW_STOCK ? `Only ${stock} left — order soon` : "In stock, ready to ship"}
      </p>

      <div ref={actionsRef} className="mt-6 flex gap-3">
        <div className="inline-flex h-14 items-center border border-line-strong" role="group" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="grid h-full w-11 place-items-center disabled:text-ink-3/50" aria-label="Decrease quantity">
            <Minus className="size-4" strokeWidth={1.4} />
          </button>
          <span className="w-8 text-center font-ui text-[15px]" aria-live="polite">
            {qty}
          </span>
          <button type="button" onClick={() => setQty((q) => Math.min(Math.min(20, stock || 1), q + 1))} disabled={qty >= Math.min(20, stock || 1)} className="grid h-full w-11 place-items-center disabled:text-ink-3/50" aria-label="Increase quantity">
            <Plus className="size-4" strokeWidth={1.4} />
          </button>
        </div>
        <Button size="lg" className="flex-1 !px-4" onClick={() => add(false)} loading={pending} disabled={soldOut}>
          {soldOut ? "Sold Out" : "Add to Bag"}
        </Button>
        <WishlistButton productId={product.id} name={product.name} variant="button" />
      </div>
      <Button variant="secondary" size="lg" block className="mt-3" onClick={() => add(true)} disabled={soldOut || pending}>
        Buy Now
      </Button>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-ui text-[13px] text-ink-2">
        <button type="button" onClick={toggleCompare} aria-pressed={inCompare} className="inline-flex min-h-9 items-center gap-2 underline-offset-4 hover:text-charcoal hover:underline">
          <GitCompareArrows className="size-4" strokeWidth={1.3} />
          {inCompare ? "Added to compare" : "Add to compare"}
        </button>
        {compare.length > 0 && (
          <Link href="/compare" className="underline underline-offset-4 hover:text-charcoal">
            View comparison ({compare.length}/{COMPARE_LIMIT})
          </Link>
        )}
      </div>

      <ul className="mt-8 space-y-3 border-t border-line pt-6 font-ui text-[14px] text-ink-2">
        <li className="flex items-start gap-3">
          <Truck className="mt-0.5 size-4 shrink-0" strokeWidth={1.3} />
          Complimentary delivery in Pakistan on orders over {formatPrice(site.freeShippingThreshold)}. Ships in 1–2 working days.
        </li>
        <li className="flex items-start gap-3">
          <Undo2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.3} />
          Easy exchange within 14 days of delivery.
        </li>
      </ul>
      {product.compareAtPrice && product.compareAtPrice > price && (
        <Badge tone="warning" className="mt-6">
          Sale — limited stock
        </Badge>
      )}

      {/* Sticky mobile add-to-bag once the main buttons scroll away */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur-sm transition-transform duration-300 lg:hidden",
          showSticky ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!showSticky}
        inert={!showSticky}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-[14px] font-medium">{product.name}</p>
          <p className="font-ui text-[13px] text-ink-2">
            {formatPrice(price)}
            {size ? ` · ${size}` : ""}
          </p>
        </div>
        <Button onClick={() => add(false)} loading={pending} disabled={soldOut}>
          {soldOut ? "Sold Out" : size || !hasSizes ? "Add to Bag" : "Select Size"}
        </Button>
      </div>

      <Drawer open={guideOpen} onClose={() => setGuideOpen(false)} side="right" title="Size guide">
        <div className="p-5 md:p-7">
          <p className="mb-5 text-ink-2">All measurements are in inches.</p>
          <SizeGuideTable />
          <Link href="/size-guide" className="link-underline ui-label mt-6 inline-block text-[12px]">
            How to measure &amp; fit notes
          </Link>
        </div>
      </Drawer>
    </div>
  );
}
