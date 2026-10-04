import "server-only";
import { cache } from "react";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { DEMO_MODE } from "@/lib/demo/mode";
import {
  demoCategories,
  demoCollections,
  demoFacets,
  demoProductBySlug,
  demoProductSlugs,
  demoProductsByIds,
  demoProductsBySlugs,
  demoSearchProducts,
  demoSearchSuggestions,
} from "@/lib/demo/catalog";
import { toCategory, toSummary, type CardRow } from "./catalog-mappers";
import type {
  CategoryDetail,
  CategorySummary,
  CollectionSummary,
  Facets,
  ProductDetail,
  ProductFilters,
  ProductPage,
  ProductSummary,
} from "@/types/domain";

export const PAGE_SIZE = 12;

const CARD_SELECT = `
  id, slug, name, price, compare_at_price, stock_quantity, created_at, rating_avg, rating_count,
  category:categories ( name, slug ),
  images:product_images ( url, alt_text, position ),
  variants:product_variants ( id, name, sku, size, color, color_hex, price, stock_quantity, position )
` as const;

/** Product cards for the given ids, returned in the same order. */
export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  const unique = [...new Set(ids)].slice(0, 100);
  if (!unique.length) return [];
  if (DEMO_MODE) return demoProductsByIds(unique);
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .in("id", unique)
    .eq("status", "active")
    .overrideTypes<CardRow[], { merge: false }>();
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  const byId = new Map(data.map((r) => [r.id, toSummary(r)]));
  return unique.map((id) => byId.get(id)).filter((p): p is ProductSummary => Boolean(p));
}

/** Product cards for the given slugs (active only), returned in the same order. */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductSummary[]> {
  if (!slugs.length) return [];
  if (DEMO_MODE) return demoProductsBySlugs(slugs);
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.from("products").select("id, slug").in("slug", slugs).eq("status", "active");
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  const idBySlug = new Map(data.map((p) => [p.slug, p.id]));
  return getProductsByIds(slugs.flatMap((s) => idBySlug.get(s) ?? []));
}

export async function searchProducts(filters: ProductFilters, pageSize = PAGE_SIZE): Promise<ProductPage> {
  if (DEMO_MODE) return demoSearchProducts(filters, pageSize);
  const supabase = createSupabasePublicClient({ revalidate: 120 });
  const page = Math.max(1, filters.page);
  const { data, error } = await supabase.rpc("search_products", {
    p_query: filters.q || undefined,
    p_category_slugs: filters.categories?.length ? filters.categories : undefined,
    p_collection_slugs: filters.collections?.length ? filters.collections : undefined,
    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,
    p_availability: filters.availability,
    p_sizes: filters.sizes?.length ? filters.sizes : undefined,
    p_colors: filters.colors?.length ? filters.colors : undefined,
    p_min_rating: filters.minRating,
    p_on_sale: filters.onSale || undefined,
    p_sort: filters.sort,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw new Error(`Product search failed: ${error.message}`);

  const total = data.length ? Number(data[0].total_count) : 0;
  const products = await getProductsByIds(data.map((r) => r.id));
  return { products, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFacets(scope: {
  categories?: string[];
  collections?: string[];
  q?: string;
  onSale?: boolean;
}): Promise<Facets> {
  if (DEMO_MODE) return demoFacets(scope);
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("catalog_facets", {
    p_category_slugs: scope.categories?.length ? scope.categories : undefined,
    p_collection_slugs: scope.collections?.length ? scope.collections : undefined,
    p_query: scope.q || undefined,
    p_on_sale: scope.onSale || undefined,
  });
  if (error) throw new Error(`Failed to load filters: ${error.message}`);
  const f = data as unknown as Facets;
  return {
    sizes: f.sizes ?? [],
    colors: f.colors ?? [],
    price: { min: Number(f.price?.min ?? 0), max: Number(f.price?.max ?? 0) },
    collections: f.collections ?? [],
    categories: f.categories ?? [],
  };
}

/** Convenience lists for merchandising rails. */
export async function getProductRail(
  rail: "new" | "best" | "featured" | "sale",
  limit = 4,
  scope: Partial<Pick<ProductFilters, "categories" | "collections">> = {},
): Promise<ProductSummary[]> {
  const sort = rail === "new" ? "newest" : rail === "best" ? "best_selling" : "featured";
  const { products } = await searchProducts({ ...scope, sort, page: 1, onSale: rail === "sale" || undefined }, limit);
  return products;
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  if (DEMO_MODE) return demoProductBySlug(slug);
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `${CARD_SELECT},
       sku, short_description, description, material, care_instructions, details, sales_count,
       
       product_collections ( collections ( name, slug, is_active ) )`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()
    .overrideTypes<
      CardRow & {
        sku: string;
        short_description: string | null;
        description: string | null;
        material: string | null;
        care_instructions: string | null;
        details: { label: string; value: string }[] | null;
        sales_count: number;
        product_collections: { collections: { name: string; slug: string; is_active: boolean } | null }[];
      },
      { merge: false }
    >();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  if (!data) return null;

  // Resolve the parent category from the cached category tree (self-referencing
  // embeds are ambiguous in PostgREST).
  const categories = await getCategories();
  const own = categories.find((c) => c.slug === data.category?.slug);
  const parent = own?.parentId ? categories.find((c) => c.id === own.parentId) : null;

  return {
    ...toSummary(data),
    sku: data.sku,
    shortDescription: data.short_description,
    description: data.description,
    material: data.material,
    careInstructions: data.care_instructions,
    details: Array.isArray(data.details) ? data.details : [],
    collections: data.product_collections
      .map((pc) => pc.collections)
      .filter((c): c is { name: string; slug: string; is_active: boolean } => Boolean(c?.is_active))
      .map(({ name, slug: s }) => ({ name, slug: s })),
    parentCategory: parent ? { name: parent.name, slug: parent.slug } : null,
    salesCount: data.sales_count,
  };
});

export async function getRelatedProducts(product: ProductDetail, limit = 4): Promise<ProductSummary[]> {
  const scope = product.category ? { categories: [product.parentCategory?.slug ?? product.category.slug] } : {};
  const { products } = await searchProducts({ ...scope, sort: "best_selling", page: 1 }, limit + 1);
  const related = products.filter((p) => p.id !== product.id);
  if (related.length >= limit) return related.slice(0, limit);
  // Top up with best sellers from the wider catalogue.
  const fallback = await getProductRail("best", limit + 1);
  for (const p of fallback) {
    if (related.length >= limit) break;
    if (p.id !== product.id && !related.some((r) => r.id === p.id)) related.push(p);
  }
  return related;
}

// ---------------------------------------------------------------------------
// Categories & collections
// ---------------------------------------------------------------------------

export const getCategories = cache(async (): Promise<CategorySummary[]> => {
  if (DEMO_MODE) return demoCategories();
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, parent_id, position")
    .eq("is_active", true)
    .order("position");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data.map(toCategory);
});

export const getCategoryBySlug = cache(async (slug: string): Promise<CategoryDetail | null> => {
  const all = await getCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) return null;
  return {
    ...category,
    parent: all.find((c) => c.id === category.parentId) ?? null,
    children: all.filter((c) => c.parentId === category.id),
  };
});

export const getCollections = cache(async (): Promise<CollectionSummary[]> => {
  if (DEMO_MODE) return demoCollections();
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("position");
  if (error) throw new Error(`Failed to load collections: ${error.message}`);
  return data.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, imageUrl: c.image_url }));
});

export async function getCollectionBySlug(slug: string): Promise<CollectionSummary | null> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

/** For sitemap.xml */
export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (DEMO_MODE) return demoProductSlugs();
  const supabase = createSupabasePublicClient({ revalidate: 3600 });
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`Failed to load product slugs: ${error.message}`);
  return data.map((p) => ({ slug: p.slug, updatedAt: p.updated_at }));
}

export type SearchSuggestions = {
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    category_name: string | null;
    image_url: string | null;
  }[];
  categories: { name: string; slug: string }[];
  collections: { name: string; slug: string }[];
};

export async function searchSuggestions(query: string): Promise<SearchSuggestions> {
  if (DEMO_MODE) return demoSearchSuggestions(query, 6);
  const supabase = createSupabasePublicClient({ revalidate: 60 });
  const { data, error } = await supabase.rpc("search_catalog", { p_query: query, p_limit: 6 });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data as unknown as SearchSuggestions;
}
