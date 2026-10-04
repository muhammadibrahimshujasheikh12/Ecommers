import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { OrderBreakdown, StatusPill } from "@/features/orders/order-view";
import { getOrderByAccessToken } from "@/lib/data/orders";
import { getCurrentUser } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/registry";
import { DEMO_MODE } from "@/lib/demo/mode";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false } };

export default async function ConfirmationPage({ params }: PageProps<"/checkout/confirmation/[token]">) {
  const { token } = await params;
  const [order, user] = await Promise.all([getOrderByAccessToken(token), getCurrentUser()]);
  if (!order) notFound();

  const provider = getPaymentProvider(order.paymentMethod);
  // Demo orders are samples: never ask anyone to pay for them.
  const instructions = DEMO_MODE
    ? []
    : (provider?.instructions?.({ id: order.id, orderNumber: order.orderNumber, accessToken: token, total: order.total, currency: order.currency, email: order.email }) ?? []);

  return (
    <div className="container-site py-12 md:py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <CircleCheck className="mx-auto size-12 text-success" strokeWidth={1} aria-hidden />
        <p className="eyebrow mt-6">Thank you{order.shippingAddress.first_name ? `, ${order.shippingAddress.first_name}` : ""}</p>
        <h1 className="heading-page mt-3">{order.status === "pending" ? "Your order has been placed" : "Your order is confirmed"}</h1>
        <p className="mt-4 text-ink-2">
          Order <strong className="font-semibold text-charcoal">{order.orderNumber}</strong> was placed on {formatDate(order.createdAt, true)}. Keep this number — you can track your order any time with it and {order.email}.
        </p>
        <div className="mt-4 flex justify-center">
          <StatusPill status={order.status} />
        </div>
        {DEMO_MODE && (
          <Alert className="mt-8">Demo store — this is a sample order saved in this browser only. No payment is due, nothing will be shipped and no email has been sent.</Alert>
        )}
        {instructions.length > 0 && (
          <Alert tone="info" className="mt-8 text-left">
            <p className="mb-2 font-ui text-[12px] font-medium uppercase tracking-[0.14em]">{provider?.label}</p>
            <ul className="space-y-1">
              {instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      <OrderBreakdown order={order} />

      <div className="mt-14 flex flex-col items-center gap-4 border-t border-line pt-10 text-center">
        {user ? (
          <ButtonLink href={`/account/orders/${order.id}`}>View order in your account</ButtonLink>
        ) : (
          <>
            <p className="max-w-md text-ink-2">Create an account to track this order, save your addresses and check out faster next time.</p>
            <ButtonLink href={`/register?email=${encodeURIComponent(order.email)}`}>Create an account</ButtonLink>
          </>
        )}
        <ButtonLink href="/shop" variant="text">
          Continue shopping
        </ButtonLink>
      </div>
    </div>
  );
}
