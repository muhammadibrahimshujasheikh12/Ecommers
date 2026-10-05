import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { CartPageView } from "@/features/cart/cart-page";
import { getSuggestedProducts } from "@/features/recommendations/data";
import { SuggestionRail } from "@/features/recommendations/suggestion-rail";
import { getCart } from "@/lib/data/cart";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Shopping Bag", path: "/cart", noIndex: true });

export default async function CartPage() {
  // Suggestions load alongside the bag; the view shows them whenever the bag is
  // (or becomes) empty.
  const [cart, picks] = await Promise.all([getCart(), getSuggestedProducts("best")]);
  return (
    <div className="container-site pb-28 pt-8 md:pt-10 lg:pb-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Shopping Bag" }]} />
      <h1 className="heading-page mb-10 mt-8">Shopping Bag</h1>
      <CartPageView
        initialCart={cart}
        suggestions={<SuggestionRail id="bag-suggestions" eyebrow="You may also like" title="Best Sellers" href="/shop?sort=best_selling" linkLabel="Shop best sellers" products={picks} />}
      />
    </div>
  );
}
