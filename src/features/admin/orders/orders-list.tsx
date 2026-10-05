import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyRow, FilterBar, Table, Td, Th, adminHref } from "@/features/admin/ui";
import { paymentLabel } from "@/features/orders/order-view";
import type { AdminOrderFilters, AdminOrderRow } from "@/lib/admin/orders";
import { formatPrice, statusLabel } from "@/utils/format";
import { OrderStatusBadge, PaymentStatusBadge } from "./badges";
import { FilterActions, FilterInput, FilterSelect } from "./filter-controls";
import { ORDER_SORT_LABELS, ORDER_SORTS, ORDER_STATUSES, PAYMENT_STATUSES } from "./status";
import { formatStoreDateTime } from "./time";

/** Query params for an orders URL (page omitted on page 1). */
export function orderFilterParams(f: AdminOrderFilters, overrides: Partial<AdminOrderFilters> = {}) {
  const v = { ...f, ...overrides };
  return {
    q: v.q || undefined,
    status: v.status ?? undefined,
    payment: v.payment ?? undefined,
    from: v.from ?? undefined,
    to: v.to ?? undefined,
    sort: v.sort === "newest" ? undefined : v.sort,
    page: v.page > 1 ? v.page : undefined,
  };
}

export const hasOrderFilters = (f: AdminOrderFilters) => Boolean(f.q || f.status || f.payment || f.from || f.to || f.sort !== "newest");

export function OrderFilters({ filters }: { filters: AdminOrderFilters }) {
  return (
    <FilterBar action="/admin/orders">
      <FilterInput
        id="orders-q"
        name="q"
        type="search"
        label="Search"
        placeholder="Order no., email or name"
        defaultValue={filters.q}
        maxLength={100}
        className="w-full sm:min-w-[240px] sm:flex-1"
      />
      <FilterSelect id="orders-status" name="status" label="Status" defaultValue={filters.status ?? ""} className="w-full sm:w-44">
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect id="orders-payment" name="payment" label="Payment" defaultValue={filters.payment ?? ""} className="w-full sm:w-40">
        <option value="">All payments</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </FilterSelect>
      <FilterInput id="orders-from" name="from" type="date" label="From" defaultValue={filters.from ?? ""} className="w-[calc(50%-6px)] sm:w-40" />
      <FilterInput id="orders-to" name="to" type="date" label="To" defaultValue={filters.to ?? ""} className="w-[calc(50%-6px)] sm:w-40" />
      <FilterSelect id="orders-sort" name="sort" label="Sort by" defaultValue={filters.sort} className="w-full sm:w-44">
        {ORDER_SORTS.map((s) => (
          <option key={s} value={s}>
            {ORDER_SORT_LABELS[s]}
          </option>
        ))}
      </FilterSelect>
      <FilterActions clearHref="/admin/orders" showClear={hasOrderFilters(filters)} />
    </FilterBar>
  );
}

export function OrdersTable({ rows, emptyMessage }: { rows: AdminOrderRow[]; emptyMessage: ReactNode }) {
  return (
    <Table label="Orders" className="min-w-[900px] [&_tbody_tr:last-child_td]:border-b-0">
      <thead>
        <tr>
          <Th>Order</Th>
          <Th>Date</Th>
          <Th>Customer</Th>
          <Th align="right">Items</Th>
          <Th align="right">Total</Th>
          <Th>Payment</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={7}>{emptyMessage}</EmptyRow>
        ) : (
          rows.map((o) => (
            <tr key={o.id} className="transition-colors hover:bg-cream/50">
              <Td>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="whitespace-nowrap font-ui font-medium text-charcoal underline-offset-4 hover:underline"
                >
                  {o.orderNumber}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-ink-2">{formatStoreDateTime(o.createdAt)}</Td>
              <Td>
                <div className="max-w-[240px]">
                  <p className="truncate">{o.customerName ?? "—"}</p>
                  <p className="truncate text-[12.5px] text-ink-3">{o.email}</p>
                </div>
              </Td>
              <Td align="right">{o.itemCount}</Td>
              <Td align="right" className="whitespace-nowrap font-medium">
                {formatPrice(o.total)}
              </Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <span className="whitespace-nowrap text-[12.5px] text-ink-2">{paymentLabel(o.paymentMethod)}</span>
                  <PaymentStatusBadge status={o.paymentStatus} />
                </div>
              </Td>
              <Td>
                <OrderStatusBadge status={o.status} />
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

/** Link to the orders list with some filters applied (used by the dashboard and customer pages). */
export const ordersHref = (params: Record<string, string | number | undefined | null>) => adminHref("/admin/orders", params);
