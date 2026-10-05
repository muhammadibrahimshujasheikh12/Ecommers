import type { Metadata } from "next";
import { PackageX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { DEMO_MODE } from "@/lib/demo/mode";
import { DEMO_ORDERS_NOTE } from "@/lib/demo/orders";

export const metadata: Metadata = { title: "Order not found", robots: { index: false, follow: false } };

/** Unknown or expired confirmation link. Renders inside the checkout layout's <main>. */
export default function OrderConfirmationNotFound() {
  return (
    <div className="container-site">
      <EmptyState
        as="h1"
        icon={<PackageX className="size-6" strokeWidth={1.2} />}
        title="We can’t find this order"
        action={
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/track-order">Track an order</ButtonLink>
              <ButtonLink href="/account/orders" variant="secondary">
                My orders
              </ButtonLink>
            </div>
            <ButtonLink href="/shop" variant="text">
              Continue shopping
            </ButtonLink>
          </div>
        }
      >
        {DEMO_MODE
          ? `${DEMO_ORDERS_NOTE} This link may be from another browser or for an older order.`
          : "This confirmation link may be incomplete or out of date. You can still look up your order with its number and the email you used at checkout."}
      </EmptyState>
    </div>
  );
}
