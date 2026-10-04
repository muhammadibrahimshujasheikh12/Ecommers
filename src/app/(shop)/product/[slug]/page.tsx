import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/misc";
import { JsonLd } from "@/components/ui/content";
import { ProductGrid } from "@/components/product/product-card";
import { ProductGallery } from "@/features/product/product-gallery";
import { PurchasePanel } from "@/features/product/purchase-panel";
import { ProductInfo } from "@/features/product/product-info";
import { RecentlyViewed } from "@/features/product/recently-viewed";
import { ReviewsSection } from "@/features/reviews/reviews-section";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getProductReviews, getReviewSummary, type ReviewSort } from "@/lib/data/reviews";
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from "@/lib/seo";
import { formatPrice } from "@/utils/format";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  return buildMetadata({
    title: `${product.name} — ${product.category?.name ?? "AURAQ"}`,
    description: `${product.shortDescription ?? product.name} ${formatPrice(product.price)}. ${product.inStock ? "In stock" : "Sold out"} — free delivery over Rs. 5,000.`,
    path: `/product/${product.slug}`,
    images: product.images.slice(0, 2).map((i) => ({ url: i.url, alt: i.alt })),
  });
}

export default async function ProductPage({ params, searchParams }: PageProps<"/product/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const reviewPage = Math.max(1, Math.min(100, Number(query.reviews_page) || 1));
  const reviewSort: ReviewSort = query.reviews_sort === "highest" || query.reviews_sort === "lowest" ? query.reviews_sort : "recent";

  const [summary, related, topReviews] = await Promise.all([
    getReviewSummary(product.id),
    getRelatedProducts(product),
    getProductReviews(product.id, { page: 1, sort: "recent" }),
  ]);

  const crumbs = [
    { name: "Home", href: "/" },
    ...(product.parentCategory ? [{ name: product.parentCategory.name, href: `/category/${product.parentCategory.slug}` }] : []),
    ...(product.category ? [{ name: product.category.name, href: `/category/${product.category.slug}` }] : []),
    { name: product.name },
  ];

  return (
    <div className="container-site pb-10 pt-6 md:pt-8">
      <Breadcrumbs items={crumbs} className="mb-6 md:mb-8" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14 xl:gap-20">
        <ProductGallery images={product.images} name={product.name} />
        <div className="lg:sticky lg:top-[150px] lg:self-start">
          <PurchasePanel product={product} />
          <div className="mt-10">
            <ProductInfo product={product} />
          </div>
        </div>
      </div>

      <ReviewsSection productId={product.id} productSlug={product.slug} summary={summary} page={reviewPage} sort={reviewSort} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-line py-16 md:py-24">
          <h2 id="related-heading" className="heading-section mb-8 md:mb-12">
            You May Also Like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}

      <RecentlyViewed currentId={product.id} />

      <JsonLd data={[productJsonLd(product, summary, topReviews.reviews), breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.href ?? `/product/${product.slug}` })))]} />
    </div>
  );
}
