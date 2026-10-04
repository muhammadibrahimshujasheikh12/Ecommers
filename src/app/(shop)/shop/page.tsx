import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { JsonLd } from "@/components/ui/content";
import { ProductListing } from "@/features/shop/product-listing";
import { parseFilters } from "@/lib/validation/filters";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

type Params = Record<string, string | string[] | undefined>;

function headingFor(params: Params) {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  if (q) return { title: `Results for “${q}”`, eyebrow: "Search", description: `Search results for ${q}.` };
  if (params.sale === "1") return { title: "Sale", eyebrow: "Limited time", description: "Selected styles at special prices — while stocks last." };
  if (params.sort === "newest") return { title: "New Arrivals", eyebrow: "Just landed", description: "The latest ready to wear, luxury pret, formals and unstitched." };
  if (params.sort === "best_selling") return { title: "Best Sellers", eyebrow: "Most loved", description: "The pieces our customers return to again and again." };
  return { title: "Shop All", eyebrow: "The Collection", description: "Ready to wear, unstitched, luxury pret and formals — crafted in Lahore." };
}

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const params = await searchParams;
  const h = headingFor(params);
  const filtered = Object.keys(params).some((k) => !["sort", "sale"].includes(k));
  return buildMetadata({ title: h.title, description: h.description, path: params.sale === "1" ? "/shop?sale=1" : "/shop", noIndex: filtered });
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const h = headingFor(params);

  return (
    <div className="container-site pb-20 pt-8 md:pb-28 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: h.title }]} />
      <header className="mb-10 mt-8 max-w-2xl md:mb-14 md:mt-10">
        <p className="eyebrow">{h.eyebrow}</p>
        <h1 className="heading-page mt-3">{h.title}</h1>
        <p className="mt-4 text-ink-2">{h.description}</p>
      </header>
      <ProductListing basePath="/shop" params={params} filters={filters} scope={{ q: filters.q, onSale: filters.onSale }} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: h.title, path: "/shop" }])} />
    </div>
  );
}
