import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { CartPageView } from "@/features/cart/cart-page";
import { getCart } from "@/lib/data/cart";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Shopping Bag", path: "/cart", noIndex: true });

export default async function CartPage() {
  const cart = await getCart();
  return (
    <div className="container-site pb-28 pt-8 md:pt-10 lg:pb-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Shopping Bag" }]} />
      <h1 className="heading-page mb-10 mt-8">Shopping Bag</h1>
      <CartPageView initialCart={cart} />
    </div>
  );
}
