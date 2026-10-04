"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Check, ChevronDown, Lock, Pencil } from "lucide-react";
import { checkoutSchema, COUNTRIES } from "@/lib/validation/schemas";
import { DEMO_MODE } from "@/lib/demo/mode";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import { quoteCheckoutAction } from "@/features/cart/actions";
import { useCart } from "@/features/cart/cart-provider";
import { CartTotals } from "@/features/cart/cart-summary";
import { AddressFields, type AddressFieldBinding } from "./address-fields";
import { placeOrderAction } from "./actions";
import type { Address, CartView } from "@/types/domain";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";

type Input = z.input<typeof checkoutSchema>;
type Output = z.output<typeof checkoutSchema>;

const STEPS = ["Information", "Shipping", "Payment", "Review"] as const;
const STEP_FIELDS: FieldPath<Input>[][] = [
  ["email", "phone"],
  ["shipping", "shippingMethod"],
  ["paymentMethod", "billingSameAsShipping", "billing"],
  ["acceptTerms", "notes"],
];

type Props = {
  initialCart: CartView;
  user: { email: string; firstName: string | null; lastName: string | null; phone: string | null } | null;
  addresses: Address[];
  paymentOptions: { code: string; label: string; description: string }[];
};

const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;

function SummaryBody({ cart }: { cart: CartView }) {
  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {cart.lines.map((l) => (
          <li key={l.lineId} className="grid grid-cols-[64px_1fr_auto] items-center gap-4">
            <div className="relative aspect-[3/4] bg-beige">
              {l.imageUrl && <Image src={l.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-charcoal font-ui text-[11px] text-ivory">{l.quantity}</span>
            </div>
            <div className="min-w-0 font-ui">
              <p className="truncate text-[14px] font-medium">{l.name}</p>
              <p className="text-[12px] text-ink-3">{[l.color, l.size].filter(Boolean).join(" / ")}</p>
              {l.status !== "ok" && <p className="text-[12px] text-sale">{l.status === "sold_out" ? "Sold out" : `Only ${l.available} available`}</p>}
            </div>
            <p className="font-ui text-[14px]">{formatPrice(l.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <CartTotals cart={cart} shippingLabel="Shipping" />
    </div>
  );
}

function OrderSummary({ cart }: { cart: CartView }) {
  return (
    <>
      {/* Mobile: collapsible */}
      <details className="group bg-cream lg:hidden">
        <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-ui text-[14px]">
          <span className="inline-flex items-center gap-2">
            Order summary <ChevronDown className="size-4 transition-transform group-open:rotate-180" strokeWidth={1.4} />
          </span>
          <strong className="font-medium">{formatPrice(cart.total)}</strong>
        </summary>
        <div className="px-5 pb-6">
          <SummaryBody cart={cart} />
        </div>
      </details>
      {/* Desktop: always visible */}
      <section aria-labelledby="summary-heading" className="hidden bg-cream p-7 lg:block">
        <h2 id="summary-heading" className="mb-6 font-display text-[26px]">
          Order summary
        </h2>
        <SummaryBody cart={cart} />
      </section>
    </>
  );
}

export function CheckoutFlow({ initialCart, user, addresses, paymentOptions }: Props) {
  const router = useRouter();
  const { setCart } = useCart();
  const formTop = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState(initialCart);
  const [quoting, startQuote] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      email: user?.email ?? "",
      phone: user?.phone ?? defaultAddress?.phone ?? "",
      marketing: false,
      savedAddressId: defaultAddress?.id ?? "",
      shipping: defaultAddress
        ? {
            firstName: defaultAddress.firstName,
            lastName: defaultAddress.lastName,
            phone: defaultAddress.phone,
            addressLine1: defaultAddress.addressLine1,
            addressLine2: defaultAddress.addressLine2 ?? "",
            city: defaultAddress.city,
            province: defaultAddress.province ?? "",
            postalCode: defaultAddress.postalCode ?? "",
            country: defaultAddress.country,
          }
        : { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "", addressLine1: "", addressLine2: "", city: "", province: "", postalCode: "", country: "PK" },
      billingSameAsShipping: true,
      saveAddress: Boolean(user && !addresses.length),
      shippingMethod: initialCart.shippingMethod ?? "",
      paymentMethod: paymentOptions[0]?.code ?? "",
      couponCode: initialCart.coupon?.valid ? initialCart.coupon.code : "",
      notes: "",
      acceptTerms: false as unknown as true,
    },
  });

  const values = useWatch({ control }) as Input;
  const shippingMethod = values.shippingMethod;
  const country = values.shipping?.country ?? "PK";
  const couponCode = values.couponCode;
  const savedAddressId = values.savedAddressId;
  const billingSame = values.billingSameAsShipping;

  // Re-price on the server whenever delivery, destination or coupon changes.
  useEffect(() => {
    startQuote(async () => {
      const res = await quoteCheckoutAction({ shippingMethod: shippingMethod || undefined, country, couponCode: couponCode || undefined, email: getValues("email") || undefined });
      if (!res.ok) return;
      setQuote(res.data);
      if (res.data.shippingMethod && res.data.shippingMethod !== getValues("shippingMethod")) {
        setValue("shippingMethod", res.data.shippingMethod);
      }
    });
  }, [shippingMethod, country, couponCode, getValues, setValue]);

  const goTo = (i: number) => {
    setStep(i);
    requestAnimationFrame(() => formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const next = async () => {
    if (await trigger(STEP_FIELDS[step], { shouldFocus: true })) goTo(step + 1);
  };

  const chooseSaved = (a: Address) => {
    setValue("savedAddressId", a.id);
    setValue("shipping", {
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? "",
      city: a.city,
      province: a.province ?? "",
      postalCode: a.postalCode ?? "",
      country: a.country,
    }, { shouldValidate: true });
  };

  const bind =
    (prefix: "shipping" | "billing"): AddressFieldBinding =>
    (name) => ({
      props: register(`${prefix}.${name}` as const, prefix === "shipping" ? { onChange: () => setValue("savedAddressId", "") } : undefined),
      error: errors[prefix]?.[name]?.message,
    });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const res = await placeOrderAction(data);
    if (!res.ok) {
      setServerError(res.error);
      for (const [path, msgs] of Object.entries(res.fieldErrors ?? {})) {
        if (msgs?.[0]) setError(path as FieldPath<Input>, { message: msgs[0] });
      }
      // Refresh totals: stock or prices may have changed.
      const fresh = await quoteCheckoutAction({ shippingMethod: data.shippingMethod, country: data.shipping.country, couponCode: data.couponCode || undefined });
      if (fresh.ok) {
        setQuote(fresh.data);
        setCart(fresh.data);
      }
      return;
    }
    router.push(res.data.redirectTo);
  });

  const methods = quote.shippingMethods;
  const coupon = quote.coupon;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
      <div className="order-first lg:order-last">
        <div className="lg:sticky lg:top-8">
          <OrderSummary cart={quote} />
          {quoting && <p className="mt-2 font-ui text-[12px] text-ink-3" aria-live="polite">Updating totals…</p>}
        </div>
      </div>

      <div ref={formTop} className="scroll-mt-6">
        <ol className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-ui text-[12px] uppercase tracking-[0.14em]" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="h-px w-5 bg-line-strong" />}
              <button
                type="button"
                onClick={() => i < step && goTo(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={cn("inline-flex items-center gap-2", i === step ? "text-charcoal" : i < step ? "text-ink-2 underline-offset-4 hover:underline" : "text-ink-3")}
              >
                <span className={cn("grid size-6 place-items-center rounded-full border text-[11px]", i < step ? "border-charcoal bg-charcoal text-ivory" : i === step ? "border-charcoal" : "border-line-strong")}>
                  {i < step ? <Check className="size-3" strokeWidth={2} /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>

        {serverError && (
          <Alert tone="error" className="mb-6">
            {serverError}{" "}
            <Link href="/cart" className="underline underline-offset-4">
              Review your bag
            </Link>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate>
          {/* 1. Information */}
          <section hidden={step !== 0} aria-labelledby="step-info">
            <h2 id="step-info" className="font-display text-[30px]">
              Contact information
            </h2>
            {!user && (
              <p className="mt-2 text-[14px] text-ink-2">
                Have an account?{" "}
                <Link href="/login?next=/checkout" className="text-charcoal underline underline-offset-4">
                  Sign in
                </Link>{" "}
                for faster checkout. Or continue as a guest.
              </p>
            )}
            <div className="mt-8 grid gap-5">
              <Input label="Email" type="email" required autoComplete="email" readOnly={Boolean(user)} hint={user ? "Your order will be linked to this account." : "Used to identify your order and contact you about delivery."} error={errors.email?.message} {...register("email")} />
              <Input label="Phone" type="tel" required autoComplete="tel" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
              <Checkbox label="Email me about new collections and private offers" {...register("marketing")} />
            </div>
            <Button className="mt-10 max-sm:w-full" size="lg" onClick={next}>
              Continue to shipping
            </Button>
          </section>

          {/* 2. Shipping */}
          <section hidden={step !== 1} aria-labelledby="step-shipping">
            <h2 id="step-shipping" className="font-display text-[30px]">
              Shipping address
            </h2>
            {addresses.length > 0 && (
              <fieldset className="mt-6 space-y-3">
                <legend className="sr-only">Saved addresses</legend>
                {addresses.map((a) => (
                  <label key={a.id} className={cn("flex cursor-pointer gap-4 border p-4 text-[14px] transition-colors", savedAddressId === a.id ? "border-charcoal bg-cream" : "border-line-strong hover:border-ink-3")}>
                    <input type="radio" name="saved-address" checked={savedAddressId === a.id} onChange={() => chooseSaved(a)} className="mt-1 accent-charcoal" />
                    <span>
                      <span className="font-ui font-medium">
                        {a.firstName} {a.lastName}
                      </span>
                      {a.isDefault && <span className="ml-2 font-ui text-[11px] uppercase tracking-[0.12em] text-ink-3">Default</span>}
                      <span className="block text-ink-2">
                        {a.addressLine1}
                        {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {countryName(a.country)}
                      </span>
                      <span className="block text-ink-3">{a.phone}</span>
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center gap-4 border p-4 font-ui text-[14px]", !savedAddressId ? "border-charcoal bg-cream" : "border-line-strong")}>
                  <input type="radio" name="saved-address" checked={!savedAddressId} onChange={() => setValue("savedAddressId", "")} className="accent-charcoal" />
                  Use a new address
                </label>
              </fieldset>
            )}
            <div className={cn("mt-8", savedAddressId && "hidden")}>
              <AddressFields bind={bind("shipping")} idPrefix="ship" country={country} />
              {user && <Checkbox className="mt-5" label="Save this address to my account" {...register("saveAddress")} />}
            </div>

            <fieldset className="mt-10">
              <legend className="font-display text-[26px]">Delivery method</legend>
              {methods.length ? (
                <div className="mt-5 space-y-3">
                  {methods.map((m) => (
                    <label key={m.code} className={cn("flex cursor-pointer items-start justify-between gap-4 border p-4", shippingMethod === m.code ? "border-charcoal bg-cream" : "border-line-strong hover:border-ink-3")}>
                      <span className="flex gap-4">
                        <input type="radio" value={m.code} {...register("shippingMethod")} className="mt-1 accent-charcoal" />
                        <span>
                          <span className="block font-ui text-[15px] font-medium">{m.name}</span>
                          <span className="block text-[13px] text-ink-2">
                            {m.minDays}–{m.maxDays} working days{m.description ? ` · ${m.description}` : ""}
                          </span>
                          {m.freeShippingThreshold !== null && m.cost > 0 && <span className="block text-[12px] text-ink-3">Free over {formatPrice(m.freeShippingThreshold)}</span>}
                        </span>
                      </span>
                      <span className="font-ui text-[14px]">{m.cost === 0 ? "Free" : formatPrice(m.cost)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <Alert tone="warning" className="mt-5">
                  We don’t currently ship to {countryName(country)}. Please choose another destination or contact customer care.
                </Alert>
              )}
              {errors.shippingMethod && (
                <p role="alert" className="mt-2 text-[13px] text-sale">
                  {errors.shippingMethod.message}
                </p>
              )}
            </fieldset>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" onClick={next} disabled={!methods.length} className="max-sm:w-full">
                Continue to payment
              </Button>
              <Button variant="text" onClick={() => goTo(0)}>
                Back
              </Button>
            </div>
          </section>

          {/* 3. Payment */}
          <section hidden={step !== 2} aria-labelledby="step-payment">
            <h2 id="step-payment" className="font-display text-[30px]">
              Payment
            </h2>
            <p className="mt-2 flex items-center gap-2 text-[14px] text-ink-2">
              <Lock className="size-4" strokeWidth={1.4} /> All transactions are secure. Your total is confirmed on our servers.
            </p>
            {paymentOptions.length ? (
              <fieldset className="mt-6 space-y-3">
                <legend className="sr-only">Payment method</legend>
                {paymentOptions.map((p) => (
                  <label key={p.code} className={cn("flex cursor-pointer gap-4 border p-4", values.paymentMethod === p.code ? "border-charcoal bg-cream" : "border-line-strong hover:border-ink-3")}>
                    <input type="radio" value={p.code} {...register("paymentMethod")} className="mt-1 accent-charcoal" />
                    <span>
                      <span className="block font-ui text-[15px] font-medium">{p.label}</span>
                      <span className="block text-[13px] text-ink-2">{p.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <Alert tone="error" className="mt-6">
                Online payment is not available right now. Please contact customer care to place your order.
              </Alert>
            )}

            <div className="mt-10">
              <h3 className="font-display text-[24px]">Billing address</h3>
              <Checkbox className="mt-4" label="Same as shipping address" {...register("billingSameAsShipping")} />
              {!billingSame && (
                <div className="mt-6">
                  <AddressFields bind={bind("billing")} idPrefix="bill" country={values.billing?.country} />
                </div>
              )}
              {errors.billing?.message && (
                <p role="alert" className="mt-2 text-[13px] text-sale">
                  {errors.billing.message}
                </p>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => {
                if (!billingSame && !getValues("billing")) setValue("billing", { ...getValues("shipping"), firstName: "", lastName: "" });
                void next();
              }} disabled={!paymentOptions.length} className="max-sm:w-full">
                Review order
              </Button>
              <Button variant="text" onClick={() => goTo(1)}>
                Back
              </Button>
            </div>
          </section>

          {/* 4. Review */}
          <section hidden={step !== 3} aria-labelledby="step-review">
            <h2 id="step-review" className="font-display text-[30px]">
              Review your order
            </h2>
            <dl className="mt-6 divide-y divide-line border-y border-line text-[14px]">
              {[
                { label: "Contact", value: `${values.email} · ${values.phone}`, step: 0 },
                {
                  label: "Ship to",
                  value: `${values.shipping?.firstName} ${values.shipping?.lastName}, ${values.shipping?.addressLine1}${values.shipping?.addressLine2 ? `, ${values.shipping.addressLine2}` : ""}, ${values.shipping?.city}, ${countryName(values.shipping?.country ?? "PK")}`,
                  step: 1,
                },
                { label: "Delivery", value: methods.find((m) => m.code === shippingMethod)?.name ?? "—", step: 1 },
                { label: "Payment", value: paymentOptions.find((p) => p.code === values.paymentMethod)?.label ?? "—", step: 2 },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[90px_1fr_auto] items-start gap-4 py-4">
                  <dt className="font-ui text-[12px] uppercase tracking-[0.12em] text-ink-3">{row.label}</dt>
                  <dd className="text-ink-2">{row.value}</dd>
                  <dd>
                    <button type="button" onClick={() => goTo(row.step)} className="inline-flex items-center gap-1 font-ui text-[12px] underline underline-offset-4" aria-label={`Edit ${row.label.toLowerCase()}`}>
                      <Pencil className="size-3" strokeWidth={1.5} /> Edit
                    </button>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <p className="font-ui text-[13px] font-medium">Discount code</p>
              {coupon?.valid ? (
                <div className="mt-2 flex items-center justify-between bg-sage px-4 py-3 font-ui text-[14px]">
                  <span>
                    <strong className="font-medium">{coupon.code}</strong> applied — you save {formatPrice(quote.discount)}
                  </span>
                  <button type="button" className="underline underline-offset-4" onClick={() => setValue("couponCode", "")}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <label htmlFor="checkout-coupon" className="sr-only">
                    Discount code
                  </label>
                  <input
                    id="checkout-coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="h-11 flex-1 rounded-[2px] border border-line-strong bg-white/60 px-3 font-ui text-[14px] uppercase tracking-[0.08em] focus:border-charcoal focus:outline-none"
                  />
                  <Button variant="secondary" size="sm" className="h-11" onClick={() => setValue("couponCode", couponInput.trim())} disabled={!couponInput.trim()} loading={quoting}>
                    Apply
                  </Button>
                </div>
              )}
              {coupon && !coupon.valid && (
                <p role="alert" className="mt-2 text-[13px] text-sale">
                  {coupon.message}
                </p>
              )}
            </div>

            <Textarea containerClassName="mt-8" label="Order notes (optional)" rows={3} maxLength={500} placeholder="Delivery instructions, gift message…" error={errors.notes?.message} {...register("notes")} />

            <Checkbox
              className="mt-6"
              error={errors.acceptTerms?.message}
              label={
                <>
                  I agree to the{" "}
                  <Link href="/terms-and-conditions" target="_blank" className="text-charcoal underline underline-offset-4">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/return-policy" target="_blank" className="text-charcoal underline underline-offset-4">
                    Return Policy
                  </Link>
                  .
                </>
              }
              {...register("acceptTerms")}
            />

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" loading={isSubmitting} disabled={!quote.canCheckout || quoting} icon={<Lock className="size-4" strokeWidth={1.4} />} className="max-sm:w-full">
                Place order · {formatPrice(quote.total)}
              </Button>
              <Button variant="text" onClick={() => goTo(2)}>
                Back
              </Button>
            </div>
            {!quote.canCheckout && <p className="mt-3 text-[13px] text-sale">Some items are unavailable. Please review your bag before placing the order.</p>}
            {DEMO_MODE && (
              <p className="mt-4 text-[13px] text-ink-3">Demo store — this saves a sample order in your browser only. No payment is taken and nothing is shipped.</p>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}
