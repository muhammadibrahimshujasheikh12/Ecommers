import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { Alert } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/features/orders/order-view";
import { getAccountStats } from "@/lib/data/account";
import { getMyOrders } from "@/lib/data/orders";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/utils/format";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default async function AccountOverviewPage({ searchParams }: PageProps<"/account">) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) return null;
  const [stats, orders] = await Promise.all([getAccountStats(user.id), getMyOrders(3)]);

  const cards = [
    { label: "Orders", value: stats.orders, href: "/account/orders", icon: Package },
    { label: "Wishlist", value: stats.wishlist, href: "/wishlist", icon: Heart },
    { label: "Saved addresses", value: stats.addresses, href: "/account/addresses", icon: MapPin },
  ];

  return (
    <div className="space-y-12">
      <h1 className="sr-only">Account overview</h1>
      {params.password === "updated" && <Alert tone="success">Your password has been updated.</Alert>}
      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, href, icon: Icon }) => (
          <li key={label}>
            <Link href={href} className="group flex items-center justify-between bg-cream p-6 transition-colors hover:bg-beige">
              <span>
                <span className="block font-display text-[40px] leading-none">{value}</span>
                <span className="mt-2 block font-ui text-[12px] uppercase tracking-[0.14em] text-ink-2">{label}</span>
              </span>
              <Icon className="size-6 text-ink-2 transition-transform group-hover:scale-110" strokeWidth={1.2} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-orders">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="recent-orders" className="font-display text-[28px]">
            Recent orders
          </h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="link-underline ui-label inline-flex items-center gap-2 text-[12px]">
              View all <ArrowRight className="size-4" strokeWidth={1.4} />
            </Link>
          )}
        </div>
        {orders.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 py-4 hover:bg-cream/60">
                  <div className="relative aspect-[3/4] bg-beige">{o.firstImage && <Image src={o.firstImage} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="font-ui">
                    <p className="text-[15px] font-medium">{o.orderNumber}</p>
                    <p className="text-[13px] text-ink-3">
                      {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {formatPrice(o.total)}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-cream p-8 text-center">
            <p className="text-ink-2">You haven’t placed any orders yet.</p>
            <ButtonLink href="/shop?sort=newest" className="mt-6">
              Start shopping
            </ButtonLink>
          </div>
        )}
      </section>

      <section aria-labelledby="account-details" className="grid gap-6 sm:grid-cols-2">
        <h2 id="account-details" className="sr-only">
          Account details
        </h2>
        <div className="border border-line p-6">
          <p className="font-ui text-[12px] uppercase tracking-[0.14em] text-ink-3">Signed in as</p>
          <p className="mt-2 font-ui text-[15px]">{user.email}</p>
          <Link href="/account/profile" className="mt-4 inline-block font-ui text-[13px] underline underline-offset-4">
            Edit profile &amp; password
          </Link>
        </div>
        <div className="border border-line p-6">
          <p className="font-ui text-[12px] uppercase tracking-[0.14em] text-ink-3">Need help?</p>
          <p className="mt-2 text-[14px] text-ink-2">Our team is available Mon–Sat, 10am–8pm PKT.</p>
          <Link href="/contact" className="mt-4 inline-block font-ui text-[13px] underline underline-offset-4">
            Contact customer care
          </Link>
        </div>
      </section>
    </div>
  );
}
