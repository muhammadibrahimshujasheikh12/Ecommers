import type { ProductFilters, SortOption } from "@/types/domain";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Highest Rated" },
];

type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] => {
  const raw = Array.isArray(v) ? v : v ? v.split(",") : [];
  return [...new Set(raw.map((s) => s.trim()).filter(Boolean))].slice(0, 20);
};
const slugList = (v: string | string[] | undefined) => list(v).filter((s) => /^[a-z0-9-]{1,120}$/.test(s));
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 10_000_000) : undefined;
};
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parse untrusted URL search params into typed, bounded filters. */
export function parseFilters(params: RawParams, defaults: Partial<ProductFilters> = {}): ProductFilters {
  const sortParam = one(params.sort);
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as SortOption) : (defaults.sort ?? "featured");
  const availability = one(params.availability);
  const page = Math.max(1, Math.min(500, Math.floor(num(params.page) ?? 1)));
  const rating = num(params.rating);
  const q = one(params.q)?.trim().slice(0, 80);

  return {
    q: q || undefined,
    categories: [...(defaults.categories ?? []), ...slugList(params.category)],
    collections: [...(defaults.collections ?? []), ...slugList(params.collection)],
    minPrice: num(params.min),
    maxPrice: num(params.max),
    availability: availability === "in_stock" || availability === "out_of_stock" ? availability : undefined,
    sizes: list(params.size).map((s) => s.slice(0, 24)),
    colors: list(params.color).map((s) => s.slice(0, 40)),
    minRating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    onSale: one(params.sale) === "1" || defaults.onSale || undefined,
    sort,
    page,
  };
}

/** Number of user-applied filters (excludes sort & page). */
export function activeFilterCount(params: RawParams): number {
  return ["category", "collection", "size", "color"].reduce((n, k) => n + list(params[k]).length, 0) +
    (params.min || params.max ? 1 : 0) +
    (params.availability ? 1 : 0) +
    (params.rating ? 1 : 0) +
    (params.sale ? 1 : 0);
}
