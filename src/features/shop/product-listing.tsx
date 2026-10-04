import Link from "next/link";
import { Suspense } from "react";
import { SearchX, X } from "lucide-react";
import { getFacets, searchProducts } from "@/lib/data/catalog";
import { activeFilterCount, SORT_OPTIONS } from "@/lib/validation/filters";
import { ProductGrid } from "@/components/product/product-card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { FilterDrawerButton, FilterSidebar, SortSelect } from "./filter-panel";
import type { ProductFilters } from "@/types/domain";
import { formatPrice } from "@/utils/format";

type RawParams = Record<string, string | string[] | undefined>;

const LABELS: Record<string, string> = { in_stock: "In stock", out_of_stock: "Sold out" };

function hrefWith(basePath: string, params: RawParams, mutate: (p: URLSearchParams) => void) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string" && v) p.set(k, v);
  mutate(p);
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function ActiveFilters({ basePath, params, names }: { basePath: string; params: RawParams; names: Record<string, string> }) {
  const chips: { label: string; href: string }[] = [];
  for (const key of ["category", "collection", "size", "color"] as const) {
    const raw = params[key];
    const values = (typeof raw === "string" ? raw : "").split(",").filter(Boolean);
    for (const v of values) {
      chips.push({
        label: names[`${key}:${v}`] ?? v,
        href: hrefWith(basePath, params, (p) => {
          const rest = values.filter((x) => x !== v);
          if (rest.length) p.set(key, rest.join(","));
          else p.delete(key);
          p.delete("page");
        }),
      });
    }
  }
  if (params.min || params.max) {
    chips.push({
      label: `${params.min ? formatPrice(Number(params.min)) : "Rs. 0"} – ${params.max ? formatPrice(Number(params.max)) : "any"}`,
      href: hrefWith(basePath, params, (p) => {
        p.delete("min");
        p.delete("max");
        p.delete("page");
      }),
    });
  }
  for (const key of ["availability", "rating", "sale"] as const) {
    const v = params[key];
    if (typeof v !== "string" || !v) continue;
    chips.push({
      label: key === "rating" ? `${v}★ & up` : key === "sale" ? "On sale" : (LABELS[v] ?? v),
      href: hrefWith(basePath, params, (p) => {
        p.delete(key);
        p.delete("page");
      }),
    });
  }
  if (!chips.length) return null;
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link key={c.href + c.label} href={c.href} scroll={false} className="inline-flex h-9 items-center gap-2 rounded-full bg-cream pl-4 pr-3 font-ui text-[13px] hover:bg-beige" aria-label={`Remove filter ${c.label}`}>
          {c.label} <X className="size-3.5" strokeWidth={1.5} />
        </Link>
      ))}
      <Link
        href={hrefWith(basePath, params, (p) => {
          for (const k of ["category", "collection", "min", "max", "availability", "size", "color", "rating", "sale", "page"]) p.delete(k);
        })}
        scroll={false}
        className="ml-1 font-ui text-[12px] uppercase tracking-[0.12em] text-ink-2 underline underline-offset-4 hover:text-charcoal"
      >
        Clear all
      </Link>
    </div>
  );
}

/**
 * Shared product browsing experience for /shop, /category/[slug] and
 * /collections/[slug]: filters (sidebar or drawer), sorting, active filter
 * chips, grid and crawlable pagination.
 */
export async function ProductListing({
  basePath,
  params,
  filters,
  scope,
  hide,
}: {
  basePath: string;
  params: RawParams;
  filters: ProductFilters;
  scope: { categories?: string[]; collections?: string[]; onSale?: boolean; q?: string };
  hide?: ("category" | "collection")[];
}) {
  const [page, facets] = await Promise.all([searchProducts(filters), getFacets(scope)]);
  const names: Record<string, string> = {};
  for (const c of facets.categories) names[`category:${c.slug}`] = c.name;
  for (const c of facets.collections) names[`collection:${c.slug}`] = c.name;
  const active = activeFilterCount(params);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-14">
      <Suspense>
        <FilterSidebar facets={facets} hide={hide} total={page.total} activeCount={active} />
      </Suspense>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
          <p className="font-ui text-[13px] tracking-[0.06em] text-ink-2" aria-live="polite">
            {page.total.toLocaleString("en-US")} {page.total === 1 ? "product" : "products"}
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            <Suspense>
              <FilterDrawerButton facets={facets} hide={hide} total={page.total} activeCount={active} />
              <SortSelect options={SORT_OPTIONS} />
            </Suspense>
          </div>
        </div>

        <ActiveFilters basePath={basePath} params={params} names={names} />

        {page.products.length ? (
          <>
            <h2 className="sr-only">Products</h2>
            <ProductGrid products={page.products} priorityCount={4} columns={3} showRating={filters.sort === "rating"} />
            <Pagination
              page={page.page}
              pageCount={page.pageCount}
              hrefFor={(n) =>
                hrefWith(basePath, params, (p) => {
                  if (n > 1) p.set("page", String(n));
                  else p.delete("page");
                })
              }
            />
          </>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" strokeWidth={1.2} />}
            title={filters.q ? `No results for “${filters.q}”` : "No products match these filters"}
            action={
              <Link href={basePath} className={buttonClasses({ variant: "secondary" })}>
                {active ? "Clear filters" : "Browse all products"}
              </Link>
            }
          >
            {filters.q ? "Check the spelling or try a broader term such as “lawn” or “formal”." : "Try removing a filter or widening the price range."}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
