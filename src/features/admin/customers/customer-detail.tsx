import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { AdminBadge, EmptyRow, Panel, Table, Td, Th } from "@/features/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/admin/orders/badges";
import { countsAsRevenue } from "@/features/admin/orders/status";
import { formatStoreDate, formatStoreDateTime } from "@/features/admin/orders/time";
import { AddressBlock, paymentLabel } from "@/features/orders/order-view";
import type { AdminCustomerDetail } from "@/lib/admin/customers";
import { formatPrice } from "@/utils/format";

export function CustomerStats({ detail }: { detail: AdminCustomerDetail }) {
  const { customer } = detail;
  const counted = detail.orders.filter((o) => countsAsRevenue(o.status)).length;
  const stats = [
    { label: "Orders", value: customer.orderCount.toLocaleString("en-US") },
    { label: "Total spent", value: formatPrice(customer.totalSpent) },
    { label: "Average order", value: counted ? formatPrice(customer.totalSpent / counted) : "—" },
    { label: "Last order", value: customer.lastOrderAt ? formatStoreDate(customer.lastOrderAt) : "—" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="min-w-0 rounded-[3px] border border-line bg-white/70 p-4 sm:p-5">
          <dt className="font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">{s.label}</dt>
          <dd className="mt-3 break-words font-ui text-[20px] font-semibold leading-tight sm:text-[24px]">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CustomerOrdersPanel({ detail }: { detail: AdminCustomerDetail }) {
  return (
    <Panel title="Orders" description="Spend excludes cancelled, returned and refunded orders." bodyClassName="py-0 md:py-0">
      <Table label="Customer orders" className="min-w-[680px] [&_tbody_tr:last-child_td]:border-b-0">
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Date</Th>
            <Th align="right">Items</Th>
            <Th align="right">Total</Th>
            <Th>Payment</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {detail.orders.length === 0 ? (
            <EmptyRow colSpan={6}>No orders yet.</EmptyRow>
          ) : (
            detail.orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-cream/50">
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="whitespace-nowrap font-ui font-medium underline-offset-4 hover:underline">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-ink-2">{formatStoreDateTime(o.createdAt)}</Td>
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
    </Panel>
  );
}

export function CustomerContactPanel({ detail, demo }: { detail: AdminCustomerDetail; demo: boolean }) {
  const { customer } = detail;
  return (
    <Panel title="Contact">
      <ul className="space-y-2.5 text-[14px]">
        <li className="flex min-w-0 items-center gap-2.5">
          <Mail aria-hidden className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
          <a href={`mailto:${customer.email}`} className="min-w-0 break-all underline-offset-4 hover:underline">
            {customer.email}
          </a>
        </li>
        {customer.phone && (
          <li className="flex items-center gap-2.5">
            <Phone aria-hidden className="size-4 shrink-0 text-ink-3" strokeWidth={1.5} />
            <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">
              {customer.phone}
            </a>
          </li>
        )}
      </ul>
      <dl className="mt-5 space-y-2 border-t border-line pt-4 font-ui text-[13.5px]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Type</dt>
          <dd>{customer.role === "admin" ? "Admin account" : customer.registered ? "Account" : "Guest checkout"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">{customer.registered && !demo ? "Account created" : "First order"}</dt>
          <dd>{customer.joinedAt ? formatStoreDate(customer.joinedAt) : "—"}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export function CustomerAddressesPanel({ detail, demo }: { detail: AdminCustomerDetail; demo: boolean }) {
  const { addresses, orderAddresses } = detail;
  return (
    <Panel
      title="Addresses"
      description={demo ? "Demo address books stay in each visitor’s browser, so these come from their orders." : undefined}
    >
      {addresses.length > 0 && (
        <>
          <h3 className="mb-3 font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">Saved addresses</h3>
          <ul className="space-y-4">
            {addresses.map((a) => (
              <li key={a.id} className="text-[14px]">
                {a.isDefault && (
                  <AdminBadge tone="neutral" className="mb-2">
                    Default
                  </AdminBadge>
                )}
                <AddressBlock
                  address={{
                    first_name: a.firstName,
                    last_name: a.lastName,
                    phone: a.phone,
                    address_line_1: a.addressLine1,
                    address_line_2: a.addressLine2,
                    city: a.city,
                    province: a.province,
                    postal_code: a.postalCode,
                    country: a.country,
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
      {orderAddresses.length > 0 && (
        <div className={addresses.length ? "mt-6 border-t border-line pt-5" : undefined}>
          <h3 className="mb-3 font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">Shipped to</h3>
          <ul className="space-y-4">
            {orderAddresses.map((a, i) => (
              <li key={i} className="text-[14px]">
                <AddressBlock address={a} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {!addresses.length && !orderAddresses.length && <p className="text-[14px] text-ink-3">No addresses saved.</p>}
    </Panel>
  );
}
