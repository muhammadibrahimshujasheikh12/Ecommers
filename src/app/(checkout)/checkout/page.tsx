import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { CheckoutFlow } from "@/features/checkout/checkout-flow";
import { getCart } from "@/lib/data/cart";
import { getMyAddresses, getProfile } from "@/lib/data/account";
import { getCurrentUser } from "@/lib/supabase/server";
import { getPaymentOptions } from "@/lib/payments/registry";
import { serverEnv } from "@/lib/env.server";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user && !serverEnv().GUEST_CHECKOUT_ENABLED) redirect("/login?next=/checkout");

  const [cart, addresses, profile] = await Promise.all([
    getCart(),
    user ? getMyAddresses() : Promise.resolve([]),
    user ? getProfile(user.id, user.email ?? "") : Promise.resolve(null),
  ]);

  if (!cart.lines.length) {
    return (
      <div className="container-site">
        <EmptyState as="h1" icon={<ShoppingBag className="size-6" strokeWidth={1.2} />} title="Your bag is empty" action={<ButtonLink href="/shop">Continue shopping</ButtonLink>}>
          Add something you love to your bag, then come back to check out.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-site py-10 md:py-14">
      <h1 className="sr-only">Checkout</h1>
      <CheckoutFlow
        initialCart={cart}
        user={user ? { email: user.email ?? "", firstName: profile?.firstName ?? null, lastName: profile?.lastName ?? null, phone: profile?.phone ?? null } : null}
        addresses={addresses}
        paymentOptions={getPaymentOptions()}
      />
    </div>
  );
}
