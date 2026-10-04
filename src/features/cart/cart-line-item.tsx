"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useWishlist } from "@/features/wishlist/wishlist-provider";
import { removeCartLineAction, takeCartLineAction, updateCartLineAction } from "./actions";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/utils/format";
import type { CartLine } from "@/types/domain";
import { cn } from "@/utils/cn";

const STATUS_MESSAGE: Partial<Record<CartLine["status"], (l: CartLine) => string>> = {
  sold_out: () => "Sold out — please remove to continue",
  insufficient_stock: (l) => `Only ${l.available} left — reduce quantity to continue`,
  unavailable: () => "No longer available",
  variant_required: () => "Please choose a size",
};

export function CartLineItem({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { setCart } = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>, onOk?: (data: unknown) => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast({ tone: "error", message: res.error ?? "Something went wrong." });
      else onOk?.(res.data);
    });

  const setQuantity = (q: number) =>
    run(() => updateCartLineAction(line.lineId, q), (d) => setCart(d as Parameters<typeof setCart>[0]));

  const remove = () =>
    run(() => removeCartLineAction(line.lineId), (d) => {
      setCart(d as Parameters<typeof setCart>[0]);
      toast({ message: `${line.name} removed from your bag` });
    });

  const moveToWishlist = () =>
    run(() => takeCartLineAction(line.lineId), (d) => {
      const data = d as { cart: Parameters<typeof setCart>[0]; productId: string };
      setCart(data.cart);
      void wishlist.add(data.productId);
      toast({ message: `${line.name} moved to your wishlist`, action: { label: "View", href: "/wishlist" } });
    });

  const problem = STATUS_MESSAGE[line.status]?.(line);
  const maxQty = Math.max(1, Math.min(20, line.available || line.quantity));

  return (
    <li className={cn("grid gap-4 border-b border-line py-5 transition-opacity", compact ? "grid-cols-[84px_1fr]" : "grid-cols-[96px_1fr] md:grid-cols-[120px_1fr_auto] md:gap-6 md:py-7", pending && "opacity-60")} aria-busy={pending}>
      <Link href={line.slug ? `/product/${line.slug}` : "#"} className="relative block aspect-[3/4] overflow-hidden bg-beige">
        {line.imageUrl && <Image src={line.imageUrl} alt={line.name} fill sizes={compact ? "84px" : "120px"} className="object-cover" />}
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <Link href={line.slug ? `/product/${line.slug}` : "#"} className="font-ui text-[15px] font-medium leading-snug hover:underline hover:underline-offset-4">
            {line.name}
          </Link>
          <p className={cn("shrink-0 font-ui text-[14px] tracking-[0.04em]", !compact && "md:hidden")}>{formatPrice(line.lineTotal)}</p>
        </div>
        <dl className="mt-1 space-y-0.5 font-ui text-[13px] text-ink-3">
          {line.color && (
            <div className="flex gap-1.5">
              <dt>Colour:</dt>
              <dd className="text-ink-2">{line.color}</dd>
            </div>
          )}
          {line.size && (
            <div className="flex gap-1.5">
              <dt>Size:</dt>
              <dd className="text-ink-2">{line.size}</dd>
            </div>
          )}
          <div className="flex gap-1.5">
            <dt>Price:</dt>
            <dd className="text-ink-2">
              {formatPrice(line.unitPrice)}
              {line.compareAtPrice && <s className="ml-1.5 text-ink-3">{formatPrice(line.compareAtPrice)}</s>}
            </dd>
          </div>
        </dl>

        {problem && <p className="mt-2 text-[13px] text-sale" role="status">{problem}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="inline-flex h-10 items-center border border-line-strong" role="group" aria-label={`Quantity for ${line.name}`}>
            <button type="button" className="grid h-full w-10 place-items-center disabled:text-ink-3/50" onClick={() => setQuantity(line.quantity - 1)} disabled={pending || line.quantity <= 1} aria-label="Decrease quantity">
              <Minus className="size-3.5" strokeWidth={1.5} />
            </button>
            <span className="min-w-8 text-center font-ui text-[14px]" aria-live="polite">
              {line.quantity}
            </span>
            <button type="button" className="grid h-full w-10 place-items-center disabled:text-ink-3/50" onClick={() => setQuantity(line.quantity + 1)} disabled={pending || line.quantity >= maxQty} aria-label="Increase quantity">
              <Plus className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <button type="button" onClick={moveToWishlist} disabled={pending} className="font-ui text-[12px] uppercase tracking-[0.12em] text-ink-2 underline underline-offset-4 hover:text-charcoal">
            Move to wishlist
          </button>
          <button type="button" onClick={remove} disabled={pending} className="font-ui text-[12px] uppercase tracking-[0.12em] text-ink-2 underline underline-offset-4 hover:text-charcoal">
            Remove
          </button>
        </div>
      </div>

      {!compact && <p className="hidden text-right font-ui text-[15px] tracking-[0.04em] md:block">{formatPrice(line.lineTotal)}</p>}
    </li>
  );
}
