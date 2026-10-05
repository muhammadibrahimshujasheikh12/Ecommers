import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { AdminBadge, Panel } from "@/features/admin/ui";
import { AddressBlock, paymentLabel } from "@/features/orders/order-view";
import type { AdminOrderDetail } from "@/lib/admin/orders";
import type { OrderAddress } from "@/types/domain";
import { formatPrice, pluralize } from "@/utils/format";
import { OrderStatusBadge, PaymentStatusBadge } from "./badges";
import { OrderNoteForm, OrderPaymentForm, OrderStatusForm } from "./order-forms";
import { ORDER_STATUS_HINTS } from "./status";
import { formatStoreDateTime } from "./time";

const sameAddress = (a: OrderAddress, b: OrderAddress) =>
  (["first_name", "last_name", "phone", "address_line_1", "address_line_2", "city", "province", "postal_code", "country"] as const).every(
    (k) => (a[k] ?? "") === (b[k] ?? ""),
  );

export function OrderItemsPanel({ order }: { order: AdminOrderDetail }) {
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Panel title={`Items (${units})`}>
      <ul className="divide-y divide-line">
        {order.items.map((item) => {
          const option = item.variantName ?? ([item.color, item.size].filter(Boolean).join(" / ") || null);
          return (
            <li key={item.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative aspect-[3/4] w-14 overflow-hidden rounded-[2px] bg-beige">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 font-ui">
                {item.productId ? (
                  <Link
                    href={`/admin/products/${item.productId}`}
                    className="text-[14.5px] font-medium text-charcoal underline-offset-4 hover:underline"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <p className="text-[14.5px] font-medium">{item.productName}</p>
                )}
                {option && <p className="mt-0.5 text-[13px] text-ink-2">{option}</p>}
                <p className="mt-0.5 text-[12.5px] text-ink-3">
                  SKU <span className="tracking-[0.02em]">{item.sku || "—"}</span>
                </p>
              </div>
              <div className="text-right font-ui">
                <p className="whitespace-nowrap text-[14.5px] font-medium">{formatPrice(item.lineTotal)}</p>
                <p className="whitespace-nowrap text-[12.5px] text-ink-3">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-6 space-y-2.5 border-t border-line pt-5 font-ui text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">
              Discount
              {order.couponCode && (
                <>
                  {" "}
                  <AdminBadge tone="neutral" className="ml-1 align-middle">
                    {order.couponCode}
                  </AdminBadge>
                </>
              )}
            </dt>
            <dd className="tabular-nums text-sale">−{formatPrice(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Shipping{order.shippingMethodName ? ` · ${order.shippingMethodName}` : ""}</dt>
          <dd className="tabular-nums">{order.shippingCost ? formatPrice(order.shippingCost) : "Free"}</dd>
        </div>
        {order.tax > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Tax</dt>
            <dd className="tabular-nums">{formatPrice(order.tax)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-[16px] font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(order.total)}</dd>
        </div>
        {order.couponCode && order.discount === 0 && (
          <p className="text-[12.5px] text-ink-3">Coupon {order.couponCode} was applied.</p>
        )}
      </dl>
    </Panel>
  );
}

export function OrderHistoryPanel({ order }: { order: AdminOrderDetail }) {
  const events = [...order.history].reverse();
  return (
    <Panel title="Status history" description="Newest first. Notes here are visible to the customer.">
      {events.length ? (
        <ol className="space-y-0">
          {events.map((event, i) => (
            <li key={`${event.status}-${event.createdAt}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
              {i < events.length - 1 && <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-line" />}
              <span
                aria-hidden
                className={`relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 ${i === 0 ? "border-charcoal bg-charcoal" : "border-line-strong bg-ivory"}`}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <OrderStatusBadge status={event.status} />
                  <time dateTime={event.createdAt} className="font-ui text-[12.5px] text-ink-3">
                    {formatStoreDateTime(event.createdAt)}
                  </time>
                </div>
                {event.note && <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{event.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[14px] text-ink-3">No status changes recorded yet.</p>
      )}
    </Panel>
  );
}

export function InternalNotesPanel({ order, demoNotesLimit }: { order: AdminOrderDetail; demoNotesLimit: number | null }) {
  return (
    <Panel title="Internal notes" description="Only staff can see these. Payment changes are logged here automatically.">
      <OrderNoteForm
        orderId={order.id}
        hint={demoNotesLimit ? `The demo store keeps the ${demoNotesLimit} newest notes per order.` : "Visible to staff only."}
      />
      {order.internalNotes.length ? (
        <ul className="mt-6 space-y-3">
          {order.internalNotes.map((note) => (
            <li key={note.id} className="rounded-[3px] bg-cream/70 px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[12.5px] text-ink-3">
                <span className="font-medium text-ink-2">{note.authorName}</span>
                {note.kind === "payment" && <AdminBadge tone="muted">Payment</AdminBadge>}
                <time dateTime={note.createdAt}>{formatStoreDateTime(note.createdAt)}</time>
              </div>
              <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-relaxed">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-[13px] text-ink-3">No notes yet.</p>
      )}
    </Panel>
  );
}

export function OrderStatusPanel({ order, restocksOnCancel }: { order: AdminOrderDetail; restocksOnCancel: boolean }) {
  return (
    <Panel title="Order status">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={order.status} />
        <p className="text-[13px] text-ink-3">{ORDER_STATUS_HINTS[order.status]}</p>
      </div>
      <OrderStatusForm
        key={order.status}
        orderId={order.id}
        orderNumber={order.orderNumber}
        current={order.status}
        restocksOnCancel={restocksOnCancel}
      />
    </Panel>
  );
}

export function PaymentPanel({ order }: { order: AdminOrderDetail }) {
  return (
    <Panel title="Payment">
      <dl className="mb-5 space-y-2 font-ui text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Method</dt>
          <dd className="text-right">{paymentLabel(order.paymentMethod)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-2">Status</dt>
          <dd>
            <PaymentStatusBadge status={order.paymentStatus} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Reference</dt>
          <dd className="min-w-0 break-all text-right">{order.paymentReference ?? <span className="text-ink-3">None</span>}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Amount</dt>
          <dd className="tabular-nums">{formatPrice(order.total)}</dd>
        </div>
      </dl>
      <OrderPaymentForm
        key={`${order.paymentStatus}:${order.paymentReference ?? ""}`}
        orderId={order.id}
        orderNumber={order.orderNumber}
        current={order.paymentStatus}
        reference={order.paymentReference}
      />
    </Panel>
  );
}

export function CustomerPanel({ order }: { order: AdminOrderDetail }) {
  return (
    <Panel title="Customer">
      <p className="font-ui text-[15px] font-medium">{order.customerName ?? order.email}</p>
      <p className="mt-0.5 text-[12.5px] text-ink-3">{order.userId ? "Account holder" : "Guest checkout"}</p>
      <ul className="mt-4 space-y-2 text-[14px]">
        <li className="flex min-w-0 items-center gap-2.5">
          <Mail aria-hidden className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
          <a href={`mailto:${order.email}`} className="min-w-0 break-all underline-offset-4 hover:underline">
            {order.email}
          </a>
        </li>
        {order.phone && (
          <li className="flex items-center gap-2.5">
            <Phone aria-hidden className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
            <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">
              {order.phone}
            </a>
          </li>
        )}
      </ul>
      <Link
        href={`/admin/customers/${order.customerId}`}
        className="mt-5 inline-flex items-center gap-2 font-ui text-[13px] font-medium text-charcoal underline-offset-4 hover:underline"
      >
        View customer
        <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.6} />
      </Link>
    </Panel>
  );
}

export function AddressesPanel({ order }: { order: AdminOrderDetail }) {
  const same = sameAddress(order.shippingAddress, order.billingAddress);
  return (
    <Panel title="Addresses">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
        <div className="text-[14px]">
          <h3 className="mb-2 font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">Shipping</h3>
          <AddressBlock address={order.shippingAddress} />
          {order.shippingMethodName && <p className="mt-2 text-[13px] text-ink-3">{order.shippingMethodName}</p>}
        </div>
        <div className="text-[14px]">
          <h3 className="mb-2 font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">Billing</h3>
          {same ? <p className="text-ink-2">Same as shipping</p> : <AddressBlock address={order.billingAddress} />}
        </div>
      </div>
    </Panel>
  );
}

export function CustomerNotePanel({ notes }: { notes: string }) {
  return (
    <Panel title="Note from the customer">
      <p className="whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-2">{notes}</p>
    </Panel>
  );
}

export function orderSummaryLine(order: AdminOrderDetail): string {
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  return `Placed ${formatStoreDateTime(order.createdAt)} · ${pluralize(units, "item")} · ${formatPrice(order.total)}`;
}
