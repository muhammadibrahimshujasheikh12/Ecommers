import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, PackageOpen, Plus } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { AdminPageHeader, FilterBar, Panel, adminHref } from "@/features/admin/ui";
import { PRODUCT_SORTS, STOCK_LABELS, STOCK_LEVELS, LOW_STOCK_THRESHOLD, type AdminProductQuery, type ProductStatus } from "@/features/admin/products/model";
import { ProductsTable } from "@/features/admin/products/products-table";
import { CategoryOptions } from "@/features/admin/products/category-options";
import { parseProductQuery } from "@/features/admin/products/schema";
import { requireAdminPage } from "@/lib/admin/auth";
import { getProductFormOptions, listAdminProducts } from "@/lib/admin/products";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PATH = "/admin/products";

/** URL for the list with some of the current filters changed (paging restarts unless given). */
const hrefWith = (query: AdminProductQuery, change: Partial<AdminProductQuery>) => {
  const next = { ...query, page: 1, ...change };
  return adminHref(PATH, {
    q: next.q,
    category: next.category,
    status: next.status,
    stock: next.stock,
    sort: next.sort === "newest" ? undefined : next.sort,
    page: next.page > 1 ? next.page : undefined,
  });
};

const STATUS_TABS: { status: ProductStatus | ""; label: string }[] = [
  { status: "", label: "All" },
  { status: "active", label: "Active" },
  { status: "draft", label: "Draft" },
  { status: "archived", label: "Archived" },
];

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPage();
  const query = parseProductQuery(await searchParams);
  const [list, options] = await Promise.all([listAdminProducts(query), getProductFormOptions()]);
  const { counts } = list;
  const filtered = Boolean(query.q || query.category || query.stock);
  const first = (list.page - 1) * list.pageSize + 1;
  const last = first + list.rows.length - 1;

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${counts.all.toLocaleString("en-US")} products in the catalogue · ${counts.active.toLocaleString("en-US")} on sale.`}
        actions={
          <ButtonLink href={`${PATH}/new`} size="sm" icon={<Plus aria-hidden className="size-4" strokeWidth={1.6} />}>
            Add product
          </ButtonLink>
        }
      />

      {(counts.out > 0 || counts.low > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[3px] border border-[#ecd9ad] bg-[#fbf3e1] px-5 py-3.5 text-[14px]">
          <AlertTriangle aria-hidden className="size-4 shrink-0 text-warning" strokeWidth={1.6} />
          <p className="font-medium">Inventory needs attention</p>
          {counts.out > 0 && (
            <Link href={hrefWith(query, { status: "active", stock: "out", sort: "best_selling" })} className="underline underline-offset-4 hover:text-ink-2">
              {counts.out} active {counts.out === 1 ? "product is" : "products are"} out of stock
            </Link>
          )}
          {counts.low > 0 && (
            <Link href={hrefWith(query, { status: "active", stock: "low", sort: "stock_asc" })} className="underline underline-offset-4 hover:text-ink-2">
              {counts.low} running low (≤ {LOW_STOCK_THRESHOLD} units)
            </Link>
          )}
        </div>
      )}

      <nav aria-label="Filter by status" className="-mx-5 mb-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {STATUS_TABS.map(({ status, label }) => {
            const active = query.status === status;
            const count = status ? counts[status] : counts.all;
            return (
              <li key={label}>
                <Link
                  href={hrefWith(query, { status })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 font-ui text-[13px] tracking-[0.04em] transition-colors",
                    active ? "border-charcoal font-medium text-charcoal" : "border-transparent text-ink-2 hover:text-charcoal",
                  )}
                >
                  {label}
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] tabular-nums", active ? "bg-charcoal text-ivory" : "bg-cream text-ink-2")}>
                    {count.toLocaleString("en-US")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Panel bodyClassName="p-5 md:p-6">
        <FilterBar action={PATH}>
          {query.status && <input type="hidden" name="status" value={query.status} />}
          <Input
            label="Search"
            type="search"
            name="q"
            defaultValue={query.q}
            placeholder="Name, SKU or handle"
            maxLength={80}
            containerClassName="w-full sm:w-auto sm:min-w-[240px] sm:flex-1"
            className="h-11"
          />
          <Select label="Category" name="category" defaultValue={query.category} containerClassName="w-full sm:w-auto sm:min-w-[180px]" className="h-11">
            <option value="">All categories</option>
            <CategoryOptions categories={options.categories} />
          </Select>
          <Select label="Stock" name="stock" defaultValue={query.stock} containerClassName="w-[calc(50%-6px)] sm:w-auto sm:min-w-[150px]" className="h-11">
            <option value="">Any stock</option>
            {STOCK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {STOCK_LABELS[level]}
                {level === "low" ? ` (≤ ${LOW_STOCK_THRESHOLD})` : ""}
              </option>
            ))}
          </Select>
          <Select label="Sort by" name="sort" defaultValue={query.sort} containerClassName="w-[calc(50%-6px)] sm:w-auto sm:min-w-[190px]" className="h-11">
            {PRODUCT_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button type="submit" className={buttonClasses({ size: "sm", className: "h-11" })}>
              Apply
            </button>
            {(filtered || query.sort !== "newest") && (
              <Link href={hrefWith(query, { q: "", category: "", stock: "", sort: "newest" })} className="font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
                Reset
              </Link>
            )}
          </div>
        </FilterBar>

        <p role="status" className="mb-4 text-[13px] text-ink-3">
          {list.total === 0
            ? "No products to show."
            : `Showing ${first.toLocaleString("en-US")}–${last.toLocaleString("en-US")} of ${list.total.toLocaleString("en-US")} ${list.total === 1 ? "product" : "products"}`}
          {list.truncated && " — only the first 5,000 products were checked for stock; narrow the search to see more."}
        </p>

        {list.rows.length > 0 ? (
          <ProductsTable key={`${query.page}:${query.status}:${query.q}:${query.category}:${query.stock}:${query.sort}`} rows={list.rows} />
        ) : (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-cream">
              <PackageOpen aria-hidden className="size-6" strokeWidth={1.4} />
            </span>
            <h2 className="mt-5 font-display text-[26px] font-medium leading-tight">
              {filtered || query.status ? "No products match these filters" : "No products yet"}
            </h2>
            <p className="mt-2 max-w-sm text-[14px] text-ink-2">
              {filtered || query.status ? "Try a different search, or clear the filters to see everything." : "Add your first product to start selling."}
            </p>
            <div className="mt-6">
              {filtered || query.status ? (
                <ButtonLink href={PATH} size="sm" variant="secondary">
                  Clear filters
                </ButtonLink>
              ) : (
                <ButtonLink href={`${PATH}/new`} size="sm">
                  Add product
                </ButtonLink>
              )}
            </div>
          </div>
        )}

        <Pagination page={list.page} pageCount={list.pageCount} hrefFor={(page) => hrefWith(query, { page })} />
      </Panel>
    </>
  );
}
