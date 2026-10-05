import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import type { OrderAddress, OrderDetail, OrderStatus } from "@/types/domain";
import { formatDate, formatPrice, statusLabel } from "@/utils/format";
import { COUNTRIES } from "@/lib/validation/schemas";
import { cn } from "@/utils/cn";

const PAYMENT_LABELS: Record<string, string> = { cod: "Cash on Delivery", bank_transfer: "Bank Transfer" };
export const paymentLabel = (code: string) => PAYMENT_LABELS[code] ?? code.replace(/_/g, " ");

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-blush",
  confirmed: "bg-powder",
  processing: "bg-powder",
  shipped: "bg-lavender",
  delivered: "bg-sage",
  cancelled: "bg-beige text-ink-2",
  returned: "bg-beige text-ink-2",
  refunded: "bg-beige text-ink-2",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-3 font-ui text-[11px] font-medium uppercase tracking-[0.12em]", STATUS_TONE[status as OrderStatus] ?? "bg-cream", className)}>
      {statusLabel(status)}
    </span>
  );
}

export function AddressBlock({ address }: { address: OrderAddress }) {
  return (
    <address className="not-italic leading-relaxed text-ink-2">
      <span className="text-charcoal">
        {address.first_name} {address.last_name}
      </span>
      <br />
      {address.address_line_1}
      {address.address_line_2 ? (
        <>
          <br />
          {address.address_line_2}
        </>
      ) : null}
      <br />
      {[address.city, address.province, address.postal_code].filter(Boolean).join(", ")}
      <br />
      {COUNTRIES.find((c) => c.code === address.country)?.name ?? address.country}
      <br />
      {address.phone}
    </address>
  );
}

const TIMELINE: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export function OrderTimeline({ status, history }: { status: OrderStatus; history: OrderDetail["history"] }) {
  if (!TIMELINE.includes(status)) {
    return <p className="text-ink-2">This order is {statusLabel(status).toLowerCase()}.</p>;
  }
  const current = TIMELINE.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Order progress">
      {TIMELINE.map((s, i) => {
        const when = history.find((h) => h.status === s)?.createdAt;
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <span className={cn("grid size-7 place-items-center rounded-full border", done ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong text-ink-3")}>
              {done ? <Check className="size-3.5" strokeWidth={2} /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <span className={cn("mt-2 font-ui text-[11px] uppercase tracking-[0.1em] md:text-[12px]", done ? "text-charcoal" : "text-ink-3")}>{statusLabel(s)}</span>
            {when && <span className="font-ui text-[11px] text-ink-3">{formatDate(when)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Full order breakdown used by confirmation, account order details and order tracking.
 * Sized by its container, not the viewport: the account pages give it less room beside their sidebar.
 */
export function OrderBreakdown({ order }: { order: OrderDetail }) {
  return (
    <div className="@container">
      <div className="grid gap-10 @4xl:grid-cols-[minmax(0,1fr)_360px] @4xl:gap-14">
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="font-ui text-[13px] font-medium uppercase tracking-[0.16em]">
            Items ({order.items.reduce((n, i) => n + i.quantity, 0)})
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 py-5">
                <div className="relative aspect-[3/4] bg-beige">
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="72px" className="object-cover" />}
                </div>
                <div className="min-w-0 font-ui">
                  {item.productSlug ? (
                    <Link href={`/product/${item.productSlug}`} className="text-[15px] font-medium hover:underline hover:underline-offset-4">
                      {item.productName}
                    </Link>
                  ) : (
                    <p className="text-[15px] font-medium">{item.productName}</p>
                  )}
                  <p className="text-[13px] text-ink-3">{[item.color, item.size].filter(Boolean).join(" / ")}</p>
                  <p className="text-[13px] text-ink-3">
                    {formatPrice(item.price)} × {item.quantity} · SKU {item.sku}
                  </p>
                </div>
                <p className="whitespace-nowrap font-ui text-[15px]">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-8">
          <dl className="space-y-3 bg-cream p-6 font-ui text-[14px]">
            <div className="flex justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sale">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd>−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-2">Shipping{order.shippingMethodName ? ` · ${order.shippingMethodName}` : ""}</dt>
              <dd>{order.shippingCost ? formatPrice(order.shippingCost) : "Complimentary"}</dd>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-2">Tax</dt>
                <dd>{formatPrice(order.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-[16px] font-medium">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-[13px]">
              <dt className="text-ink-2">Payment</dt>
              <dd>
                {paymentLabel(order.paymentMethod)} · {statusLabel(order.paymentStatus)}
              </dd>
            </div>
          </dl>
          <div className="grid gap-6 @md:grid-cols-2 @4xl:grid-cols-1">
            <div>
              <h3 className="mb-2 font-ui text-[12px] font-medium uppercase tracking-[0.16em]">Shipping address</h3>
              <AddressBlock address={order.shippingAddress} />
            </div>
            <div>
              <h3 className="mb-2 font-ui text-[12px] font-medium uppercase tracking-[0.16em]">Billing address</h3>
              <AddressBlock address={order.billingAddress} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
