"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Heart, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Price, Skeleton } from "@/components/ui/misc";
import { useCart } from "@/features/cart/cart-provider";
import { useWishlist } from "./wishlist-provider";
import { getProductsAction } from "./actions";
import type { ProductSummary } from "@/types/domain";

function WishlistItem({ product }: { product: ProductSummary }) {
  const wishlist = useWishlist();
  const { addItem } = useCart();
  const [pending, start] = useTransition();
  const sizes = product.variants.filter((v) => v.color === (product.colors[0]?.name ?? v.color));
  const [variantId, setVariantId] = useState<string>(sizes.length === 1 ? sizes[0].id : "");

  const moveToCart = () =>
    start(async () => {
      const ok = await addItem({ productId: product.id, variantId: variantId || null, quantity: 1 });
      if (ok) await wishlist.remove(product.id);
    });

  return (
    <li className="flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-beige">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {product.images[0] && <Image src={product.images[0].url} alt={product.images[0].alt} fill sizes="(min-width: 1024px) 23vw, 46vw" className="object-cover" />}
        </Link>
        <button type="button" onClick={() => wishlist.toggle(product.id, product.name)} aria-label={`Remove ${product.name} from wishlist`} className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-ivory/90">
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      <h2 className="mt-4 font-ui text-[15px] font-medium">
        <Link href={`/product/${product.slug}`} className="hover:underline hover:underline-offset-4">
          {product.name}
        </Link>
      </h2>
      <p className="font-ui text-[13px] text-ink-3">{product.category?.name}</p>
      <Price price={product.price} compareAt={product.compareAtPrice} size="sm" className="mt-1" />
      <div className="mt-4 flex flex-col gap-2">
        {product.inStock ? (
          <>
            {sizes.length > 1 && (
              <label className="sr-only" htmlFor={`size-${product.id}`}>
                Size for {product.name}
              </label>
            )}
            {sizes.length > 1 && (
              <select
                id={`size-${product.id}`}
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="h-11 border border-line-strong bg-transparent px-3 font-ui text-[13px] focus:border-charcoal focus:outline-none"
              >
                <option value="">Select size</option>
                {sizes.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                    {v.size}
                    {v.stock <= 0 ? " — sold out" : ""}
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" className="h-11" onClick={moveToCart} loading={pending} disabled={sizes.length > 1 && !variantId}>
              Move to bag
            </Button>
          </>
        ) : (
          <p className="font-ui text-[13px] text-sale">Sold out</p>
        )}
        <Link href={`/product/${product.slug}`} className="text-center font-ui text-[12px] uppercase tracking-[0.12em] text-ink-2 underline underline-offset-4">
          View product
        </Link>
      </div>
    </li>
  );
}

/** `suggestions` is a server-rendered product rail shown under the empty state. */
export function WishlistPageView({ suggestions }: { suggestions?: ReactNode }) {
  const { ids, isAuthenticated } = useWishlist();
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getProductsAction(key.split(",")).then((p) => !cancelled && setProducts(p));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const visible = !key ? [] : (products?.filter((p) => ids.includes(p.id)) ?? null);

  if (visible === null) {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6" aria-busy aria-label="Loading wishlist">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}>
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="mt-4 h-4 w-2/3" />
          </li>
        ))}
      </ul>
    );
  }

  if (!visible.length) {
    return (
      <>
        <EmptyState icon={<Heart className="size-6" strokeWidth={1.2} />} title="Your wishlist is empty" action={<ButtonLink href="/shop?sort=newest">Discover new arrivals</ButtonLink>}>
          Tap the heart on any piece to save it here.
          {!isAuthenticated && (
            <>
              {" "}
              <Link href="/login?next=/wishlist" className="underline underline-offset-4">
                Sign in
              </Link>{" "}
              to keep your wishlist across devices.
            </>
          )}
        </EmptyState>
        {suggestions}
      </>
    );
  }

  return (
    <>
      {!isAuthenticated && (
        <p className="mb-8 bg-cream px-4 py-3 text-[14px] text-ink-2">
          Your wishlist is saved on this device.{" "}
          <Link href="/login?next=/wishlist" className="text-charcoal underline underline-offset-4">
            Sign in
          </Link>{" "}
          to save it to your account.
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {visible.map((p) => (
          <WishlistItem key={p.id} product={p} />
        ))}
      </ul>
    </>
  );
}
