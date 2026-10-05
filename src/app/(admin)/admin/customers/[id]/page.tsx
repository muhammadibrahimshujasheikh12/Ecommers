import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { buttonClasses } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin/ui";
import {
  CustomerAddressesPanel,
  CustomerContactPanel,
  CustomerOrdersPanel,
  CustomerStats,
} from "@/features/admin/customers/customer-detail";
import { CustomerTypeBadge } from "@/features/admin/customers/customers-list";
import { getAdminUser, requireAdminPage } from "@/lib/admin/auth";
import { getAdminCustomer } from "@/lib/admin/customers";
import { DEMO_MODE } from "@/lib/demo/mode";

type Props = { params: Promise<{ id: string }> };

const loadCustomer = cache((id: string) => getAdminCustomer(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Metadata resolves even when the layout shows the sign-in gate: reveal nothing then.
  if (!(await getAdminUser())) return { title: "Customer" };
  const detail = await loadCustomer((await params).id);
  return { title: detail ? (detail.customer.name ?? detail.customer.email) : "Customer not found" };
}

export default async function AdminCustomerPage({ params }: Props) {
  await requireAdminPage();
  const { id } = await params;
  const detail = await loadCustomer(id);
  if (!detail) notFound();
  // A guest id whose email now has an account resolves to that account.
  if (detail.customer.id !== id) redirect(`/admin/customers/${detail.customer.id}`);
  const { customer } = detail;

  return (
    <>
      <AdminPageHeader
        crumbs={[{ name: "Customers", href: "/admin/customers" }, { name: customer.name ?? customer.email }]}
        title={customer.name ?? customer.email}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="break-all">{customer.email}</span>
            <CustomerTypeBadge customer={customer} />
          </span>
        }
        actions={
          detail.orders[0] ? (
            <Link href={`/admin/orders/${detail.orders[0].id}`} className={buttonClasses({ size: "sm", variant: "secondary" })}>
              Latest order
            </Link>
          ) : undefined
        }
      />
      <div className="space-y-6">
        <CustomerStats detail={detail} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <CustomerOrdersPanel detail={detail} />
          <div className="space-y-6">
            <CustomerContactPanel detail={detail} demo={DEMO_MODE} />
            <CustomerAddressesPanel detail={detail} demo={DEMO_MODE} />
          </div>
        </div>
      </div>
    </>
  );
}
