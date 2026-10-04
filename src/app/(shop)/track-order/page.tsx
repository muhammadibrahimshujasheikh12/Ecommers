import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/misc";
import { TrackOrderForm } from "@/features/orders/track-order-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Track your order", description: "Check the status of your AURAQ order.", path: "/track-order" });

export default function TrackOrderPage() {
  return (
    <div className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Track Order" }]} />
      <div className="mx-auto mt-10 max-w-3xl md:mt-14">
        <h1 className="heading-page">Track your order</h1>
        <p className="mb-10 mt-4 text-ink-2">
          Enter your order number (from your confirmation email) and the email address you used at checkout. Have an account?{" "}
          <Link href="/account/orders" className="text-charcoal underline underline-offset-4">
            View your orders
          </Link>
          .
        </p>
        <TrackOrderForm />
      </div>
    </div>
  );
}
