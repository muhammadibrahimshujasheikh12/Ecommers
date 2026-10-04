import "server-only";
import { sizeRank, toCategory, toSummary, type CardRow } from "@/lib/data/catalog-mappers";
import type { SearchSuggestions } from "@/lib/data/catalog";
import type {
  CategorySummary,
  CollectionSummary,
  Facets,
  ProductDetail,
  ProductFilters,
  ProductPage,
  ProductSummary,
  Swatch,
} from "@/types/domain";
import { daysAgo, demoData, demoDb, type DemoCategory, type DemoCollection, type DemoProduct } from "./db";

/*
 * Demo-mode catalogue reads over the bundled dataset. Search, facets and
 * suggestions port public.search_products, public.catalog_facets and
 * public.search_catalog (supabase/migrations/20261004000300_functions.sql),
 * so filtering, sorting and pagination behave as they do on the database.
 * Every product, category and collection in the dataset is published, which
 * is what RLS would leave visible to a shopper.
 */

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function cardRow(p: DemoProduct): CardRow {
  const category = demoDb.category(p.category_id);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compare_at_price: p.compare_at_price,
    // Seeded products keep their stock on variants (product-level stock is 0).
    stock_quantity: 0,
    created_at: daysAgo(p.created_days_ago),
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    category: category ? { name: category.name, slug: category.slug } : null,
    images: demoDb.imagesOf(p.id).map(({ url, alt_text, position }) => ({ url, alt_text, position })),
    variants: demoDb.variantsOf(p.id).map(({ id, name, sku, size, color, color_hex, price, stock_quantity, position }) => ({
      id,
      name,
      sku,
      size,
      color,
      color_hex,
      price,
      stock_quantity,
      position,
    })),
  };
}

const summaryOf = (p: DemoProduct): ProductSummary => toSummary(cardRow(p));

/** Units available to sell (public.product_available_quantity): variant stock, as product-level stock is 0. */
const availableQuantity = (p: DemoProduct) => demoDb.stockOf(p.id);

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// ---------------------------------------------------------------------------
// Text matching: ILIKE '%term%' and pg_trgm similarity()
// ---------------------------------------------------------------------------

const contains = (value: string | null | undefined, term: string) =>
  value != null && value.toLowerCase().includes(term.toLowerCase());

/** pg_trgm trigrams: lower-cased words, each padded with two leading spaces and one trailing. */
function trigrams(text: string): Set<string> {
  const set = new Set<string>();
  for (const word of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    const chars = [..."  " + word + " "];
    for (let i = 0; i + 3 <= chars.length; i++) set.add(chars.slice(i, i + 3).join(""));
  }
  return set;
}

/** pg_trgm similarity(): shared trigrams over the union of both sets. */
function similarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

const SIMILARITY_THRESHOLD = 0.3;

// ---------------------------------------------------------------------------
// search_products
// ---------------------------------------------------------------------------

type SearchArgs = Partial<Omit<ProductFilters, "page">> & { limit?: number; offset?: number };

/** One page of matching products plus the total, mirroring the RPC's rows and count(*) over (). */
function searchRows(args: SearchArgs): { rows: DemoProduct[]; total: number } {
  const term = args.q?.trim() || null;

  // The category and its direct children (target_categories).
  let categoryIds: Set<string> | null = null;
  if (args.categories?.length) {
    const slugs = new Set(args.categories);
    const roots = new Set(demoData.categories.filter((c) => slugs.has(c.slug)).map((c) => c.id));
    categoryIds = new Set(
      demoData.categories.filter((c) => roots.has(c.id) || (c.parent_id !== null && roots.has(c.parent_id))).map((c) => c.id),
    );
  }
  const collectionSlugs = args.collections?.length ? new Set(args.collections) : null;
  const sizes = args.sizes?.length ? new Set(args.sizes) : null;
  const colors = args.colors?.length ? new Set(args.colors) : null;

  const matches = demoData.products.filter((p) => {
    if (term) {
      const hit =
        contains(p.name, term) ||
        contains(p.short_description, term) ||
        contains(demoDb.category(p.category_id)?.name, term) ||
        similarity(p.name, term) > SIMILARITY_THRESHOLD;
      if (!hit) return false;
    }
    if (categoryIds && !categoryIds.has(p.category_id)) return false;
    if (collectionSlugs && !demoDb.collectionsOf(p.id).some((c) => collectionSlugs.has(c.slug))) return false;
    if (args.minPrice != null && p.price < args.minPrice) return false;
    if (args.maxPrice != null && p.price > args.maxPrice) return false;
    if (args.availability) {
      const available = availableQuantity(p);
      if (args.availability === "in_stock" ? available <= 0 : available !== 0) return false;
    }
    if (sizes && !demoDb.variantsOf(p.id).some((v) => v.size !== null && sizes.has(v.size))) return false;
    if (colors && !demoDb.variantsOf(p.id).some((v) => v.color !== null && colors.has(v.color))) return false;
    if (args.minRating != null && p.rating_avg < args.minRating) return false;
    if (args.onSale && p.compare_at_price == null) return false;
    return true;
  });

  // ORDER BY: the sort key, then created_at desc, then id.
  const sort = args.sort ?? "featured";
  matches.sort((a, b) => {
    let d = 0;
    if (sort === "price_asc") d = a.price - b.price;
    else if (sort === "price_desc") d = b.price - a.price;
    else if (sort === "best_selling") d = b.sales_count - a.sales_count;
    else if (sort === "rating") d = b.rating_avg - a.rating_avg || b.rating_count - a.rating_count;
    else if (sort === "featured") d = Number(b.featured) - Number(a.featured);
    return d || a.created_days_ago - b.created_days_ago || byText(a.id, b.id);
  });

  const limit = Math.min(Math.max(args.limit ?? 24, 1), 100);
  const offset = Math.max(args.offset ?? 0, 0);
  const rows = matches.slice(offset, offset + limit);
  // The count rides on the returned rows, so a page past the end reports 0.
  return { rows, total: rows.length ? matches.length : 0 };
}

export function demoSearchProducts(filters: ProductFilters, pageSize: number): ProductPage {
  const page = Math.max(1, filters.page);
  const { rows, total } = searchRows({ ...filters, limit: pageSize, offset: (page - 1) * pageSize });
  return { products: rows.map(summaryOf), total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// ---------------------------------------------------------------------------
// catalog_facets
// ---------------------------------------------------------------------------

export function demoFacets(scope: { categories?: string[]; collections?: string[]; q?: string; onSale?: boolean }): Facets {
  const { rows: base } = searchRows({
    q: scope.q,
    categories: scope.categories,
    collections: scope.collections,
    onSale: scope.onSale,
    limit: 100,
  });
  const variants = base.flatMap((p) => demoDb.variantsOf(p.id));

  const sizes = [...new Set(variants.map((v) => v.size).filter((s): s is string => s !== null))].sort(
    (a, b) => sizeRank(a) - sizeRank(b) || byText(a, b),
  );

  // One swatch per colour name, with the lowest hex seen (min(color_hex)).
  const hexByColor = new Map<string, string | null>();
  for (const v of variants) {
    if (v.color === null) continue;
    const seen = hexByColor.get(v.color) ?? null;
    hexByColor.set(v.color, seen === null || (v.color_hex !== null && v.color_hex < seen) ? v.color_hex : seen);
  }
  const colors: Swatch[] = [...hexByColor]
    .sort(([a], [b]) => byText(a, b))
    .map(([name, hex]) => ({ name, hex }));

  const prices = base.map((p) => p.price);

  const collections = new Map<string, DemoCollection>();
  const categories = new Map<string, DemoCategory>();
  for (const p of base) {
    for (const c of demoDb.collectionsOf(p.id)) collections.set(c.id, c);
    const category = demoDb.category(p.category_id);
    if (category) categories.set(category.id, category);
  }

  return {
    sizes,
    colors,
    price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    collections: [...collections.values()].sort((a, b) => a.position - b.position).map(({ slug, name }) => ({ slug, name })),
    categories: [...categories.values()].sort((a, b) => a.position - b.position).map(({ slug, name }) => ({ slug, name })),
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Product cards for the given (already de-duplicated) ids, in the same order. */
export function demoProductsByIds(ids: string[]): ProductSummary[] {
  return ids.flatMap((id) => {
    const p = demoDb.product(id);
    return p ? [summaryOf(p)] : [];
  });
}

/** Product cards for the given slugs, in the same order. */
export function demoProductsBySlugs(slugs: string[]): ProductSummary[] {
  return demoProductsByIds([...new Set(slugs.flatMap((s) => demoDb.productBySlug(s)?.id ?? []))].slice(0, 100));
}

export function demoProductBySlug(slug: string): ProductDetail | null {
  const p = demoDb.productBySlug(slug);
  if (!p) return null;
  const own = demoDb.category(p.category_id);
  const parent = own?.parent_id ? demoDb.category(own.parent_id) : null;

  return {
    ...summaryOf(p),
    sku: p.sku,
    shortDescription: p.short_description,
    description: p.description,
    material: p.material,
    careInstructions: p.care_instructions,
    details: Array.isArray(p.details) ? p.details : [],
    collections: demoDb.collectionsOf(p.id).map(({ name, slug: s }) => ({ name, slug: s })),
    parentCategory: parent ? { name: parent.name, slug: parent.slug } : null,
    salesCount: p.sales_count,
  };
}

/** For sitemap.xml: newest first. Demo rows are never edited, so updatedAt is the creation time. */
export function demoProductSlugs(): { slug: string; updatedAt: string }[] {
  return [...demoData.products]
    .sort((a, b) => a.created_days_ago - b.created_days_ago)
    .slice(0, 5000)
    .map((p) => ({ slug: p.slug, updatedAt: daysAgo(p.created_days_ago) }));
}

// ---------------------------------------------------------------------------
// Categories & collections
// ---------------------------------------------------------------------------

export function demoCategories(): CategorySummary[] {
  return [...demoData.categories].sort((a, b) => a.position - b.position).map(toCategory);
}

export function demoCollections(): CollectionSummary[] {
  return [...demoData.collections]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, imageUrl: c.image_url }));
}

// ---------------------------------------------------------------------------
// search_catalog
// ---------------------------------------------------------------------------

export function demoSearchSuggestions(query: string, limit = 6): SearchSuggestions {
  const term = query.trim();
  if (!term) return { products: [], categories: [], collections: [] };
  const lower = term.toLowerCase();

  const products = demoData.products
    .map((p) => ({ p, category: demoDb.category(p.category_id), score: similarity(p.name, term) }))
    .filter(({ p, category, score }) => contains(p.name, term) || contains(category?.name, term) || score > SIMILARITY_THRESHOLD)
    // Names starting with the term first, then closest match, then best sellers.
    .sort(
      (a, b) =>
        Number(b.p.name.toLowerCase().startsWith(lower)) - Number(a.p.name.toLowerCase().startsWith(lower)) ||
        b.score - a.score ||
        b.p.sales_count - a.p.sales_count,
    )
    .slice(0, Math.min(Math.max(limit, 1), 20))
    .map(({ p, category }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compare_at_price: p.compare_at_price,
      category_name: category?.name ?? null,
      image_url: demoDb.imagesOf(p.id)[0]?.url ?? null,
    }));

  const named = <T extends { name: string; slug: string; position: number }>(rows: T[]) =>
    rows
      .filter((r) => contains(r.name, term))
      .sort((a, b) => a.position - b.position)
      .slice(0, 4)
      .map(({ name, slug }) => ({ name, slug }));

  return { products, categories: named(demoData.categories), collections: named(demoData.collections) };
}
