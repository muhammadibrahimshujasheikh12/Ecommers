import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { WishlistPageView } from "@/features/wishlist/wishlist-page";
import { getSuggestedProducts } from "@/features/recommendations/data";
import { SuggestionRail } from "@/features/recommendations/suggestion-rail";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Wishlist", path: "/wishlist", noIndex: true });

export default async function WishlistPage() {
  const picks = await getSuggestedProducts("best");
  return (
    <div className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Wishlist" }]} />
      <h1 className="heading-page mb-10 mt-8">Wishlist</h1>
      <WishlistPageView
        suggestions={<SuggestionRail id="wishlist-suggestions" eyebrow="Worth saving" title="Most Loved" href="/shop?sort=best_selling" linkLabel="Shop best sellers" products={picks} />}
      />
    </div>
  );
}
