import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { StatusPill } from "@/features/orders/order-view";
import { getMyOrders } from "@/lib/data/orders";
import { formatDate, formatPrice } from "@/utils/format";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

export default async function OrdersPage() {
  const orders = await getMyOrders();
  return (
    <div>
      <h1 className="font-display text-[32px]">Orders</h1>
      {orders.length ? (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="border border-line">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream/60 px-5 py-3 font-ui text-[13px]">
                <span>
                  <span className="text-ink-3">Order</span> <strong className="font-medium">{o.orderNumber}</strong>
                </span>
                <span className="text-ink-3">Placed {formatDate(o.createdAt)}</span>
              </div>
              <div className="grid grid-cols-[64px_1fr] items-center gap-4 p-5 sm:grid-cols-[64px_1fr_auto]">
                <div className="relative aspect-[3/4] bg-beige">{o.firstImage && <Image src={o.firstImage} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="font-ui">
                  <StatusPill status={o.status} />
                  <p className="mt-2 text-[14px] text-ink-2">
                    {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {formatPrice(o.total)}
                  </p>
                </div>
                <ButtonLink href={`/account/orders/${o.id}`} variant="secondary" size="sm" className="col-span-2 sm:col-span-1">
                  View details
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Package className="size-6" strokeWidth={1.2} />} title="No orders yet" action={<ButtonLink href="/shop?sort=newest">Shop new arrivals</ButtonLink>}>
          When you place an order it will appear here so you can track it.
        </EmptyState>
      )}
      <p className="mt-8 text-[14px] text-ink-2">
        Ordered as a guest?{" "}
        <Link href="/track-order" className="text-charcoal underline underline-offset-4">
          Track an order
        </Link>
      </p>
    </div>
  );
}
