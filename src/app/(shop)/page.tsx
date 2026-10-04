import type { Metadata } from "next";
import { HeroCarousel } from "@/features/home/hero";
import {
  CollectionSpotlight,
  CustomerReviews,
  EditorialBanner,
  FeaturedCollections,
  NewsletterSection,
  ProductRail,
  ServiceBenefits,
  ShopByCategory,
  SocialGallery,
} from "@/features/home/sections";
import { ShopTheLook } from "@/features/home/shop-the-look";
import { WatchAndShop } from "@/features/home/watch-and-shop";
import { getProductRail, getProductsByIds } from "@/lib/data/catalog";
import { getStoreRating } from "@/lib/data/reviews";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { heroSlides, shopTheLook, watchAndShop } from "@/content/home";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/content/site";
import type { ProductSummary } from "@/types/domain";

export const metadata: Metadata = {
  ...buildMetadata({
    title: `${site.name} — Luxury Pret, Formals & Unstitched`,
    path: "/",
    images: [{ url: "/images/og-default.jpg", alt: "AURAQ — The Festive Edit" }],
  }),
  title: { absolute: `${site.name} — Luxury Pret, Formals & Unstitched | Pakistani Designer Wear` },
};

async function productsBySlug(slugs: string[]): Promise<Map<string, ProductSummary>> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("products").select("id, slug").in("slug", slugs).eq("status", "active");
  const products = await getProductsByIds((data ?? []).map((p) => p.id));
  return new Map(products.map((p) => [p.slug, p]));
}

export default async function HomePage() {
  const [newArrivals, bestSellers, rating, featured] = await Promise.all([
    getProductRail("new", 4),
    getProductRail("best", 4),
    getStoreRating(),
    productsBySlug([...shopTheLook.items.map((i) => i.slug), ...watchAndShop.map((r) => r.slug)]),
  ]);

  const lookItems = shopTheLook.items.flatMap((i) => (featured.get(i.slug) ? [{ product: featured.get(i.slug)!, hotspot: i.hotspot }] : []));
  const reels = watchAndShop.flatMap((r) => (featured.get(r.slug) ? [{ ...r, product: featured.get(r.slug)! }] : []));

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <FeaturedCollections />
      <ShopByCategory />
      <ProductRail id="new-arrivals" eyebrow="Just Landed" title="New Arrivals" href="/shop?sort=newest" linkLabel="View All" products={newArrivals} />
      <EditorialBanner />
      {lookItems.length > 0 && <ShopTheLook title={shopTheLook.title} text={shopTheLook.text} image={shopTheLook.image} alt={shopTheLook.alt} items={lookItems} />}
      <ProductRail id="best-sellers" eyebrow="Most Loved" title="Best Sellers" href="/shop?sort=best_selling" linkLabel="View All Best Sellers" products={bestSellers} centered tone="cream" showRating />
      <CollectionSpotlight />
      <WatchAndShop reels={reels} />
      <CustomerReviews average={rating.average} count={rating.count} reviews={rating.recent} />
      <ServiceBenefits />
      <SocialGallery />
      <NewsletterSection />
    </>
  );
}
