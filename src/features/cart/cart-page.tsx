"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Lock, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { CartLineItem } from "./cart-line-item";
import { CartTotals, CouponForm, FreeShippingProgress } from "./cart-summary";
import { useCart } from "./cart-provider";
import type { CartView } from "@/types/domain";

/** `suggestions` is a server-rendered product rail shown under the empty state. */
export function CartPageView({ initialCart, suggestions }: { initialCart: CartView; suggestions?: ReactNode }) {
  const { cart, revision } = useCart();
  // Server-rendered cart until the shopper changes something on this page.
  const [baseRevision] = useState(revision);
  const view = revision > baseRevision && cart ? cart : initialCart;

  if (!view.lines.length) {
    return (
      <>
        <EmptyState
          icon={<ShoppingBag className="size-6" strokeWidth={1.2} />}
          title="Your bag is empty"
          action={<ButtonLink href="/shop?sort=newest">Shop new arrivals</ButtonLink>}
        >
          Pieces you add to your bag will appear here. Explore the new season or revisit your{" "}
          <Link href="/wishlist" className="underline underline-offset-4">
            wishlist
          </Link>
          .
        </EmptyState>
        {suggestions}
      </>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <section aria-labelledby="bag-items">
        <h2 id="bag-items" className="sr-only">
          Items in your bag
        </h2>
        <div className="mb-2 hidden grid-cols-[120px_1fr_auto] gap-6 border-b border-line pb-3 font-ui text-[12px] uppercase tracking-[0.14em] text-ink-3 md:grid">
          <span>Item</span>
          <span />
          <span>Total</span>
        </div>
        <ul>
          {view.lines.map((line) => (
            <CartLineItem key={line.lineId} line={line} />
          ))}
        </ul>
        <Link href="/shop" className="link-underline ui-label mt-8 inline-block text-[12px]">
          Continue shopping
        </Link>
      </section>

      <aside aria-labelledby="summary-heading" className="lg:sticky lg:top-[150px] lg:self-start">
        <div className="bg-cream">
          <FreeShippingProgress subtotal={view.subtotal} discount={view.discount} />
          <div className="space-y-6 p-5 md:p-7">
            <h2 id="summary-heading" className="font-display text-[26px]">
              Order summary
            </h2>
            <CouponForm cart={view} />
            <CartTotals cart={view} />
            <ButtonLink href="/checkout" block size="lg" aria-disabled={!view.canCheckout} icon={<Lock className="size-4" strokeWidth={1.4} />}>
              Secure checkout
            </ButtonLink>
            {!view.canCheckout && <p className="text-[13px] text-sale">Some items need your attention before checkout.</p>}
            <p className="text-center font-ui text-[12px] tracking-[0.04em] text-ink-3">Cash on delivery available nationwide</p>
          </div>
        </div>
      </aside>

      {/* Sticky mobile checkout bar (globals.css pads the page bottom so it never hides the footer) */}
      <div
        data-mobile-checkout-bar
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
      >
        <div className="flex-1 font-ui">
          <p className="text-[12px] uppercase tracking-[0.12em] text-ink-3">Total</p>
          <p className="text-[16px] font-medium">Rs. {Math.round(view.total).toLocaleString("en-US")}</p>
        </div>
        <ButtonLink href="/checkout" aria-disabled={!view.canCheckout}>
          Checkout
        </ButtonLink>
      </div>
    </div>
  );
}
