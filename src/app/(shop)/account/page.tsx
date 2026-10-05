import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, Ruler, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/features/orders/order-view";
import { StreamedSuggestions } from "@/features/recommendations/streamed-suggestions";
import { getAccountStats } from "@/lib/data/account";
import { getMyOrders } from "@/lib/data/orders";
import { getCurrentUser } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/mode";
import { DEMO_PASSWORD_NOTE } from "@/lib/demo/account";
import { formatDate, formatPrice, pluralize } from "@/utils/format";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

/** First-visit panel for customers who haven't ordered yet: a welcome, a gift and next steps. */
function WelcomePanel({ wishlist, addresses }: { wishlist: number; addresses: number }) {
  const steps = [
    {
      href: "/wishlist",
      icon: Heart,
      title: "Your wishlist",
      text: wishlist ? `${pluralize(wishlist, "piece")} saved — ready when you are` : "Tap the heart on any piece to save it here",
    },
    {
      href: "/account/addresses",
      icon: MapPin,
      title: "Delivery addresses",
      text: addresses ? `${pluralize(addresses, "address", "addresses")} saved for faster checkout` : "Add an address for a faster checkout",
    },
    { href: "/size-guide", icon: Ruler, title: "Find your size", text: "Measurements, fit notes and stitching advice" },
    { href: "/account/profile", icon: UserRound, title: "Profile & security", text: "Add your name and phone for delivery updates" },
  ];

  return (
    <>
      <section aria-labelledby="welcome-heading" className="overflow-hidden bg-cream">
        <div className="grid sm:grid-cols-[2fr_3fr]">
          <div className="relative aspect-[16/9] bg-powder sm:aspect-auto sm:min-h-[340px]">
            <Image src="/images/campaigns/story-luxury.jpg" alt="Two models in powder blue and ivory luxury pret under an arch" fill sizes="(min-width: 1440px) 400px, (min-width: 640px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <p className="eyebrow">Welcome to AURAQ</p>
            <h2 id="welcome-heading" className="mt-3 font-display text-[30px] leading-tight md:text-[38px]">
              Your wardrobe starts here
            </h2>
            <p className="mt-4 max-w-md text-ink-2">
              Thank you for joining us. Save the pieces you love, keep your details ready for a quicker checkout, and be the first to see each new collection from our Lahore atelier.
            </p>
            <p className="mt-5 max-w-md border-l-2 border-charcoal pl-4 font-ui text-[13px] leading-relaxed tracking-[0.02em]">
              A welcome gift: 10% off your first order over {formatPrice(5000)} with code <strong className="font-semibold tracking-[0.08em]">WELCOME10</strong>.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ButtonLink href="/shop?sort=newest" className="max-sm:w-full">
                Explore new arrivals
              </ButtonLink>
              <Link href="/collections" className="link-underline ui-label text-[12px]">
                Browse collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Get started">
        <ul className="grid gap-3 sm:grid-cols-2">
          {steps.map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <Link href={href} className="group flex h-full items-center gap-4 border border-line p-5 transition-colors hover:border-charcoal">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream">
                  <Icon className="size-[18px]" strokeWidth={1.3} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-ui text-[15px] font-medium">{title}</span>
                  <span className="block text-[13px] leading-snug text-ink-2">{text}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" strokeWidth={1.4} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default async function AccountOverviewPage({ searchParams }: PageProps<"/account">) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) return null;
  const [stats, orders] = await Promise.all([getAccountStats(user.id), getMyOrders(3)]);
  const firstVisit = stats.orders === 0 && orders.length === 0;

  const cards = [
    { label: "Orders", value: stats.orders, href: "/account/orders", icon: Package },
    { label: "Wishlist", value: stats.wishlist, href: "/wishlist", icon: Heart },
    { label: "Saved addresses", value: stats.addresses, href: "/account/addresses", icon: MapPin },
  ];

  return (
    <div className="space-y-12">
      <h1 className="sr-only">Account overview</h1>
      {params.password === "updated" && <Alert tone="success">{DEMO_MODE ? DEMO_PASSWORD_NOTE : "Your password has been updated."}</Alert>}

      {firstVisit ? (
        <>
          <WelcomePanel wishlist={stats.wishlist} addresses={stats.addresses} />
          <StreamedSuggestions rail="featured" id="picked-for-you" eyebrow="Picked for you" title="Pieces to start with" href="/shop" linkLabel="Shop all" compact divider={false} />
        </>
      ) : (
        <>
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
                <p className="text-ink-2">Your recent orders will appear here.</p>
                <ButtonLink href="/account/orders" variant="secondary" className="mt-6">
                  View order history
                </ButtonLink>
              </div>
            )}
          </section>
        </>
      )}

      <section aria-labelledby="account-details" className="grid gap-6 sm:grid-cols-2">
        <h2 id="account-details" className="sr-only">
          Account details
        </h2>
        <div className="border border-line p-6">
          <p className="font-ui text-[12px] uppercase tracking-[0.14em] text-ink-3">Signed in as</p>
          <p className="mt-2 break-words font-ui text-[15px]">{user.email}</p>
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
