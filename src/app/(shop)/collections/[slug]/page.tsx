import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/content";
import { ListingHero } from "@/features/shop/listing-hero";
import { ProductListing } from "@/features/shop/product-listing";
import { getCollectionBySlug, getCollections } from "@/lib/data/catalog";
import { parseFilters } from "@/lib/validation/filters";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found" };
  return buildMetadata({
    title: collection.name,
    description: collection.description ?? `Shop ${collection.name} at AURAQ.`,
    path: `/collections/${collection.slug}`,
    images: collection.imageUrl ? [{ url: collection.imageUrl, alt: collection.name }] : undefined,
  });
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [collection, all] = await Promise.all([getCollectionBySlug(slug), getCollections()]);
  if (!collection) notFound();

  const filters = parseFilters(query);
  filters.collections = [collection.slug];
  const crumbs = [{ name: "Home", href: "/" }, { name: "Collections", href: "/collections" }, { name: collection.name }];

  return (
    <>
      <ListingHero
        crumbs={crumbs}
        eyebrow="Collection"
        title={collection.name}
        description={collection.description}
        image={collection.imageUrl}
        tone="blush"
        links={all.map((c) => ({ label: c.name, href: `/collections/${c.slug}`, slug: c.slug }))}
        activeSlug={collection.slug}
      />
      <div className="container-site pb-20 md:pb-28">
        <ProductListing basePath={`/collections/${collection.slug}`} params={query} filters={filters} scope={{ collections: [collection.slug] }} hide={["collection"]} />
      </div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Collections", path: "/collections" },
          { name: collection.name, path: `/collections/${collection.slug}` },
        ])}
      />
    </>
  );
}
