import "server-only";
import { getProductRail } from "@/lib/data/catalog";
import type { ProductSummary } from "@/types/domain";

export type SuggestionRailKind = "new" | "best" | "featured";

/**
 * Product suggestions for empty states (bag, wishlist, compare, 404, zero
 * results, new accounts). `exclude` drops products already on the page.
 * Suggestions are a nice-to-have, so a failed lookup returns an empty list
 * instead of breaking the page around it.
 */
export async function getSuggestedProducts(rail: SuggestionRailKind, limit = 4, exclude: string[] = []): Promise<ProductSummary[]> {
  try {
    const products = await getProductRail(rail, limit + exclude.length);
    return products.filter((p) => !exclude.includes(p.id)).slice(0, limit);
  } catch (error) {
    console.error(`Failed to load "${rail}" suggestions`, error);
    return [];
  }
}
