import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { AdminPageHeader, Panel, adminHref } from "@/features/admin/ui";
import { customerFilterParams, CustomerFilters, CustomersTable, hasCustomerFilters } from "@/features/admin/customers/customers-list";
import { ResultsSummary } from "@/features/admin/orders/filter-controls";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCustomers, parseCustomerFilters } from "@/lib/admin/customers";
import { DEMO_MODE } from "@/lib/demo/mode";

export const metadata: Metadata = { title: "Customers" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireAdminPage();
  const filters = parseCustomerFilters(await searchParams);
  const result = await listAdminCustomers(filters);

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description={
          DEMO_MODE
            ? "Everyone who has ordered from the demo store, by email — accounts and guest checkouts."
            : "Customer accounts and guests who checked out without one, with their order history."
        }
      />
      <CustomerFilters filters={filters} />
      <ResultsSummary page={result.page} pageSize={result.pageSize} total={result.total} noun={["customer", "customers"]} />
      <Panel bodyClassName="py-0 md:py-0">
        <CustomersTable
          rows={result.rows}
          emptyMessage={
            result.total > 0 ? (
              <>
                This page is empty.{" "}
                <Link href={adminHref("/admin/customers", customerFilterParams(filters, { page: 1 }))} className="underline underline-offset-4">
                  Go to the first page
                </Link>
              </>
            ) : hasCustomerFilters(filters) && filters.q ? (
              <>
                No customers match “{filters.q}”.{" "}
                <Link href="/admin/customers" className="underline underline-offset-4">
                  Clear search
                </Link>
              </>
            ) : (
              "No customers yet."
            )
          }
        />
      </Panel>
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => adminHref("/admin/customers", customerFilterParams(filters, { page }))}
      />
    </>
  );
}
