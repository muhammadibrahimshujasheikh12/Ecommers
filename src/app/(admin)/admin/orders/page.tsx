import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { AdminPageHeader, Panel, adminHref } from "@/features/admin/ui";
import { ResultsSummary } from "@/features/admin/orders/filter-controls";
import { hasOrderFilters, orderFilterParams, OrderFilters, OrdersTable } from "@/features/admin/orders/orders-list";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminOrders, parseOrderFilters } from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdminPage();
  const filters = parseOrderFilters(await searchParams);
  const result = await listAdminOrders(filters);
  const filtered = hasOrderFilters(filters);

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Every order placed in the store. Search, filter and open an order to update its status or payment."
      />
      <OrderFilters filters={filters} />
      <ResultsSummary page={result.page} pageSize={result.pageSize} total={result.total} noun={["order", "orders"]} />
      <Panel bodyClassName="py-0 md:py-0">
        <OrdersTable
          rows={result.rows}
          emptyMessage={
            result.total > 0 ? (
              <>
                This page is empty.{" "}
                <Link href={adminHref("/admin/orders", orderFilterParams(filters, { page: 1 }))} className="underline underline-offset-4">
                  Go to the first page
                </Link>
              </>
            ) : filtered ? (
              <>
                No orders match these filters.{" "}
                <Link href="/admin/orders" className="underline underline-offset-4">
                  Clear filters
                </Link>
              </>
            ) : (
              "No orders yet. New orders will appear here as soon as they’re placed."
            )
          }
        />
      </Panel>
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => adminHref("/admin/orders", orderFilterParams(filters, { page }))}
      />
    </>
  );
}
