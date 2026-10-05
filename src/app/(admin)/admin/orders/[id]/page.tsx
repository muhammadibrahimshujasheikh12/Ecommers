import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AdminPageHeader } from "@/features/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/admin/orders/badges";
import {
  AddressesPanel,
  CustomerNotePanel,
  CustomerPanel,
  InternalNotesPanel,
  OrderHistoryPanel,
  OrderItemsPanel,
  OrderStatusPanel,
  orderSummaryLine,
  PaymentPanel,
} from "@/features/admin/orders/order-detail";
import { getAdminUser, requireAdminPage } from "@/lib/admin/auth";
import { getAdminOrder } from "@/lib/admin/orders";
import { DEMO_NOTES_PER_ORDER } from "@/lib/demo/admin-orders";
import { DEMO_MODE } from "@/lib/demo/mode";

type Props = { params: Promise<{ id: string }> };

/** Metadata and page share one load per request. */
const loadOrder = cache((id: string) => getAdminOrder(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Metadata resolves even when the layout shows the sign-in gate: reveal nothing then.
  if (!(await getAdminUser())) return { title: "Order" };
  const order = await loadOrder((await params).id);
  return { title: order ? `Order ${order.orderNumber}` : "Order not found" };
}

export default async function AdminOrderPage({ params }: Props) {
  await requireAdminPage();
  const order = await loadOrder((await params).id);
  if (!order) notFound();

  return (
    <>
      <AdminPageHeader
        crumbs={[{ name: "Orders", href: "/admin/orders" }, { name: order.orderNumber }]}
        title={`Order ${order.orderNumber}`}
        description={orderSummaryLine(order)}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </>
        }
      />

      {/* Phones: status & payment first, then the order, then customer details. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="space-y-6 lg:col-start-2 lg:row-start-1">
          <OrderStatusPanel order={order} restocksOnCancel={!DEMO_MODE} />
          <PaymentPanel order={order} />
        </div>
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <OrderItemsPanel order={order} />
          {order.notes && <CustomerNotePanel notes={order.notes} />}
          <OrderHistoryPanel order={order} />
          <InternalNotesPanel order={order} demoNotesLimit={DEMO_MODE ? DEMO_NOTES_PER_ORDER : null} />
        </div>
        <div className="space-y-6 lg:col-start-2 lg:row-start-2">
          <CustomerPanel order={order} />
          <AddressesPanel order={order} />
        </div>
      </div>
    </>
  );
}
