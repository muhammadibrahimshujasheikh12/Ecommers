"use client";

import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { formatPrice } from "@/utils/format";
import { CartLineItem } from "./cart-line-item";
import { FreeShippingProgress } from "./cart-summary";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { isOpen, close, cart, count, isLoading } = useCart();
  const loading = isLoading && !cart;
  const empty = cart && cart.lines.length === 0;

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
        <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
          <div className="mb-6 grid size-16 place-items-center rounded-full bg-cream">
            <ShoppingBag className="size-6" strokeWidth={1.2} />
          </div>
          <p className="font-display text-[28px] leading-tight">Your bag is empty</p>
          <p className="mt-3 text-ink-2">Discover the new season’s pieces and find something you love.</p>
          <ButtonLink href="/shop?sort=newest" className="mt-8" onClick={close}>
            Shop new arrivals
          </ButtonLink>
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
