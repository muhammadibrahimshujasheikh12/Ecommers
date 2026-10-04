"use client";

import { useState, useTransition } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { applyCouponAction, removeCouponAction } from "./actions";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/utils/format";
import { site } from "@/content/site";
import type { CartView } from "@/types/domain";

export function FreeShippingProgress({ subtotal, discount }: { subtotal: number; discount: number }) {
  const value = subtotal - discount;
  const remaining = Math.max(0, site.freeShippingThreshold - value);
  const pct = Math.min(100, (value / site.freeShippingThreshold) * 100);
  return (
    <div className="bg-cream px-5 py-4 text-[13px] leading-snug md:px-7">
      <p>
        {remaining > 0 ? (
          <>
            You’re <strong className="font-semibold">{formatPrice(remaining)}</strong> away from complimentary delivery
          </>
        ) : (
          <>You’ve unlocked <strong className="font-semibold">complimentary delivery</strong></>
        )}
      </p>
      <div className="mt-2.5 h-0.5 bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Progress to free delivery">
        <div className="h-full bg-charcoal transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CouponForm({ cart }: { cart: CartView }) {
  const { setCart } = useCart();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const applied = cart.coupon?.valid ? cart.coupon : null;

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 bg-sage px-4 py-3 font-ui text-[14px]">
        <span className="flex items-center gap-2">
          <Tag className="size-4" strokeWidth={1.4} aria-hidden />
          <span>
            <strong className="font-medium tracking-[0.08em]">{applied.code}</strong>
            {applied.description && <span className="text-ink-2"> · {applied.description}</span>}
          </span>
        </span>
        <button
          type="button"
          aria-label={`Remove code ${applied.code}`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await removeCouponAction();
              if (res.ok) setCart(res.data);
            })
          }
          className="grid size-8 place-items-center"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await applyCouponAction(code);
          if (!res.ok) setError(res.error);
          else {
            setCart(res.data);
            setCode("");
            toast({ message: res.message ?? "Code applied" });
          }
        });
      }}
      noValidate
    >
      <label htmlFor="coupon" className="font-ui text-[13px] font-medium">
        Discount code
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className="h-11 min-w-0 flex-1 rounded-[2px] border border-line-strong bg-white/60 px-3 font-ui text-[14px] uppercase tracking-[0.08em] focus:border-charcoal focus:outline-none"
        />
        <Button type="submit" variant="secondary" size="sm" className="h-11" loading={pending} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-2 text-[13px] text-sale">
          {error}
        </p>
      )}
    </form>
  );
}

export function CartTotals({ cart, shippingLabel = "Estimated shipping" }: { cart: CartView; shippingLabel?: string }) {
  const method = cart.shippingMethods.find((m) => m.code === cart.shippingMethod);
  return (
    <div>
    <dl className="space-y-3 font-ui text-[14px]">
      <div className="flex justify-between">
        <dt className="text-ink-2">Subtotal</dt>
        <dd>{formatPrice(cart.subtotal)}</dd>
      </div>
      {cart.discount > 0 && (
        <div className="flex justify-between text-sale">
          <dt>Discount{cart.coupon?.code ? ` (${cart.coupon.code})` : ""}</dt>
          <dd>−{formatPrice(cart.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-2">
          {shippingLabel}
          {method && <span className="block text-[12px] text-ink-3">{method.name}</span>}
        </dt>
        <dd>{cart.shipping === 0 ? "Complimentary" : formatPrice(cart.shipping)}</dd>
      </div>
      {cart.tax > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink-2">Estimated tax</dt>
          <dd>{formatPrice(cart.tax)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-line pt-4 text-[16px] font-medium">
        <dt>{shippingLabel === "Shipping" ? "Total" : "Estimated total"}</dt>
        <dd>{formatPrice(cart.total)}</dd>
      </div>
    </dl>
      <p className="mt-3 text-[12px] tracking-[0.02em] text-ink-3">Prices in PKR, inclusive of applicable taxes. Final total confirmed at checkout.</p>
    </div>
  );
}
