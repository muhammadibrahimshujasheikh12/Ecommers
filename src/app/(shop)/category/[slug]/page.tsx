import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/content";
import { ListingHero } from "@/features/shop/listing-hero";
import { ProductListing } from "@/features/shop/product-listing";
import { getCategoryBySlug } from "@/lib/data/catalog";
import { parseFilters } from "@/lib/validation/filters";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return buildMetadata({
    title: category.parent ? `${category.name} — ${category.parent.name}` : category.name,
    description: category.description ?? `Shop ${category.name} at AURAQ.`,
    path: `/category/${category.slug}`,
    images: category.imageUrl ? [{ url: category.imageUrl, alt: category.name }] : undefined,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseFilters(query);
  // Sub-category selections narrow within this category; otherwise show all of it.
  if (!filters.categories?.length) filters.categories = [category.slug];

  const parent = category.parent;
  const siblingsRoot = parent ?? category;
  const crumbs = [
    { name: "Home", href: "/" },
    ...(parent ? [{ name: parent.name, href: `/category/${parent.slug}` }] : []),
    { name: category.name },
  ];
  const hasChildren = category.children.length > 0;
  const linkSource = hasChildren ? category.children : parent ? (await getCategoryBySlug(parent.slug))?.children ?? [] : [];
  const links = linkSource.length
    ? [{ label: `All ${siblingsRoot.name}`, href: `/category/${siblingsRoot.slug}`, slug: siblingsRoot.slug }, ...linkSource.map((c) => ({ label: c.name, href: `/category/${c.slug}`, slug: c.slug }))]
    : undefined;

  return (
    <>
      <ListingHero crumbs={crumbs} eyebrow={parent?.name ?? "Category"} title={category.name} description={category.description} image={category.imageUrl} links={links} activeSlug={category.slug} />
      <div className="container-site pb-20 md:pb-28">
        <ProductListing
          basePath={`/category/${category.slug}`}
          params={query}
          filters={filters}
          scope={{ categories: [category.slug] }}
          hide={hasChildren ? undefined : ["category"]}
        />
      </div>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.href ?? `/category/${category.slug}` })))} />
    </>
  );
}
