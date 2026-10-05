import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBadge, EmptyRow, FilterBar, Table, Td, Th } from "@/features/admin/ui";
import { FilterActions, FilterInput, FilterSelect } from "@/features/admin/orders/filter-controls";
import { formatStoreDate } from "@/features/admin/orders/time";
import { CUSTOMER_SORT_LABELS, CUSTOMER_SORTS, type AdminCustomerFilters, type AdminCustomerRow } from "@/lib/admin/customers";
import { formatPrice } from "@/utils/format";

export function customerFilterParams(f: AdminCustomerFilters, overrides: Partial<AdminCustomerFilters> = {}) {
  const v = { ...f, ...overrides };
  return { q: v.q || undefined, sort: v.sort === "recent" ? undefined : v.sort, page: v.page > 1 ? v.page : undefined };
}

export const hasCustomerFilters = (f: AdminCustomerFilters) => Boolean(f.q || f.sort !== "recent");

export function CustomerTypeBadge({ customer }: { customer: Pick<AdminCustomerRow, "role" | "registered"> }) {
  if (customer.role === "admin") return <AdminBadge tone="info">Admin</AdminBadge>;
  if (!customer.registered) return <AdminBadge tone="muted">Guest</AdminBadge>;
  return null;
}

export function CustomerFilters({ filters }: { filters: AdminCustomerFilters }) {
  return (
    <FilterBar action="/admin/customers">
      <FilterInput
        id="customers-q"
        name="q"
        type="search"
        label="Search"
        placeholder="Name, email or phone"
        defaultValue={filters.q}
        maxLength={100}
        className="w-full sm:min-w-[260px] sm:flex-1"
      />
      <FilterSelect id="customers-sort" name="sort" label="Sort by" defaultValue={filters.sort} className="w-full sm:w-48">
        {CUSTOMER_SORTS.map((s) => (
          <option key={s} value={s}>
            {CUSTOMER_SORT_LABELS[s]}
          </option>
        ))}
      </FilterSelect>
      <FilterActions clearHref="/admin/customers" showClear={hasCustomerFilters(filters)} />
    </FilterBar>
  );
}

export function CustomersTable({ rows, emptyMessage }: { rows: AdminCustomerRow[]; emptyMessage: ReactNode }) {
  return (
    <Table label="Customers" className="min-w-[860px] [&_tbody_tr:last-child_td]:border-b-0">
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th align="right">Orders</Th>
          <Th align="right">Total spent</Th>
          <Th>Last order</Th>
          <Th>Customer since</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={6}>{emptyMessage}</EmptyRow>
        ) : (
          rows.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-cream/50">
              <Td>
                <div className="flex items-center gap-2.5">
                  <Link href={`/admin/customers/${c.id}`} className="font-ui font-medium text-charcoal underline-offset-4 hover:underline">
                    {c.name ?? "Unnamed customer"}
                  </Link>
                  <CustomerTypeBadge customer={c} />
                </div>
              </Td>
              <Td className="max-w-[260px] truncate text-ink-2">{c.email}</Td>
              <Td align="right">{c.orderCount.toLocaleString("en-US")}</Td>
              <Td align="right" className="whitespace-nowrap font-medium">
                {formatPrice(c.totalSpent)}
              </Td>
              <Td className="whitespace-nowrap text-ink-2">{c.lastOrderAt ? formatStoreDate(c.lastOrderAt) : "—"}</Td>
              <Td className="whitespace-nowrap text-ink-2">{c.joinedAt ? formatStoreDate(c.joinedAt) : "—"}</Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
