import { NextResponse, type NextRequest } from "next/server";
import { getProductRail, searchProducts, searchSuggestions, type SearchSuggestions } from "@/lib/data/catalog";
import type { ProductSummary } from "@/types/domain";

const SUGGESTION_LIMIT = 6;
const TRENDING_LIMIT = 4;

const toSuggestion = (p: ProductSummary): SearchSuggestions["products"][number] => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  price: p.price,
  compare_at_price: p.compareAtPrice,
  category_name: p.category?.name ?? null,
  image_url: p.images[0]?.url ?? null,
});

/**
 * Instant search suggestions for the search overlay.
 * `?q=` — products, categories and collections matching the query.
 * `?trending=1` — best sellers for the overlay's idle state and the empty bag drawer.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("trending") === "1") {
    try {
      const products = await getProductRail("best", TRENDING_LIMIT);
      const body: SearchSuggestions = { products: products.map(toSuggestion), categories: [], collections: [] };
      return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600" } });
    } catch (error) {
      console.error("trending failed", error);
      return NextResponse.json({ error: "Trending unavailable" }, { status: 503 });
    }
  }

  const q = (params.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [], collections: [] });
  try {
    const data = await searchSuggestions(q);
    let products = data.products;
    if (products.length < SUGGESTION_LIMIT) {
      // Name matches lead; top up with the description matches the results page
      // shows for the same query (e.g. "lawn", "chiffon"), so the overlay never
      // reports "no results" for a search that has them.
      const more = await searchProducts({ q, sort: "best_selling", page: 1 }, SUGGESTION_LIMIT);
      const seen = new Set(products.map((p) => p.id));
      products = [...products, ...more.products.filter((p) => !seen.has(p.id)).map(toSuggestion)].slice(0, SUGGESTION_LIMIT);
    }
    return NextResponse.json({ ...data, products }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("search failed", error);
    return NextResponse.json({ error: "Search unavailable" }, { status: 503 });
  }
}
