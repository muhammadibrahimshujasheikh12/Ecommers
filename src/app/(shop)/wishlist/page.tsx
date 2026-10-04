import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { WishlistPageView } from "@/features/wishlist/wishlist-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Wishlist", path: "/wishlist", noIndex: true });

export default function WishlistPage() {
  return (
    <div className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Wishlist" }]} />
      <h1 className="heading-page mb-10 mt-8">Wishlist</h1>
      <WishlistPageView />
    </div>
  );
}
