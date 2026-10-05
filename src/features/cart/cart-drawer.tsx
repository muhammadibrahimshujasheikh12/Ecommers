"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { MiniProductCard, MiniProductSkeleton } from "@/features/recommendations/mini-product-card";
import { useTrendingProducts } from "@/features/recommendations/use-trending-products";
import { formatPrice } from "@/utils/format";
import { CartLineItem } from "./cart-line-item";
import { FreeShippingProgress } from "./cart-summary";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { isOpen, close, cart, count, isLoading } = useCart();
  const loading = isLoading && !cart;
  const empty = cart && cart.lines.length === 0;
  // Suggestions for the empty bag. A zero count means the bag is almost
  // certainly empty, so the request runs alongside the cart fetch, not after it.
  const picks = useTrendingProducts(isOpen && (count === 0 || Boolean(empty)));

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      side="right"
      title={`Your bag (${count})`}
      footer={
        cart && cart.lines.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between font-ui">
              <span className="text-[13px] font-medium uppercase tracking-[0.14em]">Subtotal</span>
              <span className="text-[16px] font-medium">{formatPrice(cart.subtotal - cart.discount)}</span>
            </div>
            <p className="text-[12px] text-ink-3">Shipping and discounts are calculated at checkout.</p>
            <ButtonLink href="/checkout" block onClick={close} aria-disabled={!cart.canCheckout}>
              Checkout
            </ButtonLink>
            <ButtonLink href="/cart" variant="secondary" block onClick={close}>
              View bag
            </ButtonLink>
            {!cart.canCheckout && <p className="text-center text-[13px] text-sale">Please review the items marked above to continue.</p>}
          </div>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-6 p-6" aria-label="Loading your bag" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="grid grid-cols-[84px_1fr] gap-4">
              <Skeleton className="aspect-[3/4]" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : empty || !cart ? (
        <div className="flex min-h-full flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10 pt-10 text-center md:pt-12">
            <div className="mb-6 grid size-16 place-items-center rounded-full bg-cream">
              <ShoppingBag className="size-6" strokeWidth={1.2} />
            </div>
            <p className="font-display text-[28px] leading-tight">Your bag is empty</p>
            <p className="mt-3 text-ink-2">Discover the new season’s pieces and find something you love.</p>
            <ButtonLink href="/shop?sort=newest" className="mt-8" onClick={close}>
              Shop new arrivals
            </ButtonLink>
          </div>
          {picks?.length !== 0 && (
            <section aria-labelledby="bag-drawer-picks" className="border-t border-line px-5 pb-8 pt-7 md:px-7">
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <h3 id="bag-drawer-picks" className="ui-label">
                  You may also like
                </h3>
                <Link href="/shop?sort=best_selling" onClick={close} className="link-underline font-ui text-[11px] font-medium uppercase tracking-[0.14em]">
                  Best sellers
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-7" aria-busy={!picks || undefined}>
                {picks
                  ? picks.map((p) => (
                      <li key={p.id}>
                        <MiniProductCard product={p} sizes="(min-width: 460px) 200px, 46vw" onNavigate={close} />
                      </li>
                    ))
                  : [0, 1, 2, 3].map((i) => (
                      <li key={i}>
                        <MiniProductSkeleton />
                      </li>
                    ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <>
          <FreeShippingProgress subtotal={cart.subtotal} discount={cart.discount} />
          <ul className="px-5 md:px-7">
            {cart.lines.map((line) => (
              <CartLineItem key={line.lineId} line={line} compact />
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
