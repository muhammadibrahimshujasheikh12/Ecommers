import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PackageX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { OrderBreakdown, OrderTimeline, StatusPill } from "@/features/orders/order-view";
import { getMyOrder } from "@/lib/data/orders";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderDetailsPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  // RLS returns nothing for orders that belong to someone else.
  const order = await getMyOrder(id);

  if (!order) {
    return (
      <EmptyState icon={<PackageX className="size-6" strokeWidth={1.2} />} title="Order not found" action={<ButtonLink href="/account/orders">Back to orders</ButtonLink>}>
        We couldn’t find this order in your account. It may have been placed with a different email address.
      </EmptyState>
    );
  }

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-2 font-ui text-[13px] text-ink-2 hover:text-charcoal">
        <ArrowLeft className="size-4" strokeWidth={1.4} /> All orders
      </Link>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px]">Order {order.orderNumber}</h1>
          <p className="font-ui text-[14px] text-ink-2">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>
      <div className="my-10 border-y border-line py-8">
        <OrderTimeline status={order.status} history={order.history} />
      </div>
      <OrderBreakdown order={order} />
      {order.notes && (
        <p className="mt-8 text-[14px] text-ink-2">
          <span className="font-ui text-[12px] uppercase tracking-[0.14em] text-ink-3">Notes: </span>
          {order.notes}
        </p>
      )}
    </div>
  );
}
