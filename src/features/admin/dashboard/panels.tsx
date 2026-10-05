import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, ClipboardList, Minus, Star } from "lucide-react";
import type { ReactNode } from "react";
import { AdminBadge, Panel } from "@/features/admin/ui";
import { OrderStatusBadge } from "@/features/admin/orders/badges";
import { ordersHref } from "@/features/admin/orders/orders-list";
import { OPEN_ORDER_STATUSES, ORDER_STATUSES } from "@/features/admin/orders/status";
import { formatStoreDateTime } from "@/features/admin/orders/time";
import type { DashboardData, DashboardLowStock, DashboardProduct, DashboardRecentOrder, DashboardTotals } from "@/lib/admin/dashboard";
import type { OrderStatus } from "@/types/domain";
import { cn } from "@/utils/cn";
import { formatPrice, pluralize, statusLabel } from "@/utils/format";
import { FrameLink } from "./range-picker";

const compactMoney = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const count = (n: number) => n.toLocaleString("en-US");

// ---------------------------------------------------------------------------
// KPI tiles
// ---------------------------------------------------------------------------

function Delta({ current, previous, period }: { current: number; previous: number; period: string }) {
  let tone: "up" | "down" | "flat" | "new" = "flat";
  let text = "No change";
  if (previous === 0 && current > 0) {
    tone = "new";
    text = "New";
  } else if (previous > 0) {
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.abs(pct) < 10 ? Math.round(pct * 10) / 10 : Math.round(pct);
    if (rounded > 0) tone = "up";
    else if (rounded < 0) tone = "down";
    text = rounded === 0 ? "No change" : `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toLocaleString("en-US")}%`;
  }
  const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px]">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          tone === "up" && "text-success",
          tone === "down" && "text-sale",
          (tone === "flat" || tone === "new") && "text-ink-2",
        )}
      >
        {tone !== "new" && <Icon aria-hidden className="size-3.5" strokeWidth={2} />}
        {text}
      </span>
      <span className="text-ink-3">vs {period}</span>
    </p>
  );
}

function KpiTile({ label, value, compactValue, current, previous, period }: {
  label: string;
  value: string;
  /** Shorter form for narrow phones. */
  compactValue?: string;
  current: number;
  previous: number;
  period: string;
}) {
  return (
    <div className="min-w-0 rounded-[3px] border border-line bg-white/70 p-4 sm:p-5">
      <p className="font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">{label}</p>
      <p className="mt-3 font-ui text-[22px] font-semibold leading-none tracking-[-0.01em] sm:text-[27px]">
        {compactValue ? (
          <>
            <span className="sm:hidden">{compactValue}</span>
            <span className="hidden sm:inline">{value}</span>
          </>
        ) : (
          value
        )}
      </p>
      <Delta current={current} previous={previous} period={period} />
    </div>
  );
}

export function KpiRow({ current, previous, days }: { current: DashboardTotals; previous: DashboardTotals; days: number }) {
  const period = `previous ${days} days`;
  const money = (n: number) => `Rs. ${compactMoney.format(Math.round(n))}`;
  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <KpiTile
        label="Revenue"
        value={formatPrice(current.revenue)}
        compactValue={money(current.revenue)}
        current={current.revenue}
        previous={previous.revenue}
        period={period}
      />
      <KpiTile label="Orders" value={count(current.orders)} current={current.orders} previous={previous.orders} period={period} />
      <KpiTile
        label="Average order"
        value={formatPrice(current.averageOrderValue)}
        compactValue={money(current.averageOrderValue)}
        current={current.averageOrderValue}
        previous={previous.averageOrderValue}
        period={period}
      />
      <KpiTile label="Customers" value={count(current.customers)} current={current.customers} previous={previous.customers} period={period} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Orders by status
// ---------------------------------------------------------------------------

export function StatusBreakdown({ byStatus, range }: { byStatus: Record<OrderStatus, number>; range: DashboardData["range"] }) {
  const total = ORDER_STATUSES.reduce((n, s) => n + byStatus[s], 0);
  const max = Math.max(1, ...ORDER_STATUSES.map((s) => byStatus[s]));
  return (
    <Panel title="Orders by status" description={`${pluralize(total, "order")} placed in the last ${range.days} days`} className="h-full">
      <ul className="space-y-1">
        {ORDER_STATUSES.map((s) => {
          const n = byStatus[s];
          return (
            <li key={s}>
              <Link
                href={ordersHref({ status: s, from: range.firstDay, to: range.lastDay })}
                className="group grid grid-cols-[96px_minmax(0,1fr)_40px] items-center gap-3 rounded-[2px] py-1.5 font-ui text-[13px] hover:bg-cream/60"
              >
                <span className={cn("pl-1", n ? "text-charcoal" : "text-ink-3")}>{statusLabel(s)}</span>
                <span aria-hidden className="h-2 rounded-full bg-cream">
                  {n > 0 && <span className="block h-2 rounded-full bg-[#bf6a4f] group-hover:bg-[#9a4f37]" style={{ width: `${Math.max(3, (n / max) * 100)}%` }} />}
                </span>
                <span className={cn("pr-1 text-right tabular-nums", n ? "font-medium" : "text-ink-3")}>
                  {count(n)}
                  <span className="sr-only"> {statusLabel(s).toLowerCase()} orders — view them</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

function AttentionRow({ href, icon, label, value, hint }: { href: string; icon: ReactNode; label: string; value: number; hint: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-4 rounded-[3px] px-2 py-3 transition-colors hover:bg-cream/70">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", value ? "bg-[#f3e2b8]" : "bg-cream")}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-ui text-[14px] font-medium">{label}</span>
          <span className="block text-[12.5px] text-ink-3">{hint}</span>
        </span>
        <span className="font-ui text-[20px] font-semibold tabular-nums">{count(value)}</span>
        <ArrowRight aria-hidden className="size-4 text-ink-3" strokeWidth={1.5} />
      </Link>
    </li>
  );
}

export function AttentionPanel({ openOrders, pendingReviews, lowStockCount }: { openOrders: number; pendingReviews: number; lowStockCount: number }) {
  return (
    <Panel title="Needs attention" className="h-full" bodyClassName="p-3 md:p-3">
      <ul className="divide-y divide-line">
        <AttentionRow
          href={ordersHref({ status: "pending" })}
          icon={<ClipboardList aria-hidden className="size-[18px]" strokeWidth={1.5} />}
          label="Orders to fulfil"
          value={openOrders}
          hint={`${OPEN_ORDER_STATUSES.map((s) => statusLabel(s).toLowerCase()).join(", ")} — all time`}
        />
        <AttentionRow
          href="/admin/reviews"
          icon={<Star aria-hidden className="size-[18px]" strokeWidth={1.5} />}
          label="Reviews to moderate"
          value={pendingReviews}
          hint="Waiting for approval"
        />
        <AttentionRow
          href="/admin/products"
          icon={<Boxes aria-hidden className="size-[18px]" strokeWidth={1.5} />}
          label="Low stock"
          value={lowStockCount}
          hint="Variants with 3 or fewer left"
        />
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Recent orders
// ---------------------------------------------------------------------------

export function RecentOrders({ orders }: { orders: DashboardRecentOrder[] }) {
  return (
    <Panel
      title="Recent orders"
      actions={
        <Link href="/admin/orders" className="inline-flex min-h-10 items-center gap-1.5 font-ui text-[13px] text-ink-2 hover:text-charcoal">
          All orders
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.5} />
        </Link>
      }
      bodyClassName="p-0 md:p-0"
    >
      {orders.length ? (
        <ul className="divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-cream/50 md:px-6 sm:grid-cols-[110px_minmax(0,1fr)_auto_auto]"
              >
                <span className="font-ui text-[14px] font-medium">{o.orderNumber}</span>
                <span className="order-3 col-span-2 min-w-0 truncate text-[13px] text-ink-2 sm:order-none sm:col-span-1">
                  {o.customerName ?? o.email}
                  <span className="text-ink-3"> · {formatStoreDateTime(o.createdAt)}</span>
                </span>
                <span className="text-right font-ui text-[14px] tabular-nums">{formatPrice(o.total)}</span>
                <span className="order-4 justify-self-end sm:order-none">
                  <OrderStatusBadge status={o.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-10 text-center text-[14px] text-ink-3">No orders yet.</p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Top products
// ---------------------------------------------------------------------------

export function TopProducts({ products, by, toggleHref }: { products: DashboardProduct[]; by: "revenue" | "units"; toggleHref: (by: "revenue" | "units") => string }) {
  return (
    <Panel
      title="Top products"
      description={by === "revenue" ? "By revenue in this period" : "By units sold in this period"}
      actions={
        <nav aria-label="Rank top products by" className="inline-flex rounded-[3px] border border-line p-0.5">
          {(["revenue", "units"] as const).map((key) => (
            <FrameLink
              key={key}
              href={toggleHref(key)}
              current={by === key}
              className={cn(
                "inline-flex h-8 items-center rounded-[2px] px-3 font-ui text-[12px]",
                by === key ? "bg-charcoal text-ivory" : "text-ink-2 hover:bg-cream",
              )}
            >
              {key === "revenue" ? "Revenue" : "Units"}
            </FrameLink>
          ))}
        </nav>
      }
    >
      {products.length ? (
        <ol className="space-y-3">
          {products.map((p, i) => (
            <li key={p.productId ?? p.name} className="grid grid-cols-[20px_44px_minmax(0,1fr)_auto] items-center gap-3">
              <span className="font-ui text-[12px] tabular-nums text-ink-3">{i + 1}</span>
              <span className="relative aspect-[3/4] w-11 overflow-hidden rounded-[2px] bg-beige">
                {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="44px" className="object-cover" />}
              </span>
              <span className="min-w-0">
                {p.productId ? (
                  <Link href={`/admin/products/${p.productId}`} className="block truncate font-ui text-[14px] font-medium underline-offset-4 hover:underline">
                    {p.name}
                  </Link>
                ) : (
                  <span className="block truncate font-ui text-[14px] font-medium">{p.name}</span>
                )}
                <span className="block text-[12.5px] text-ink-3">{pluralize(p.units, "unit")} sold</span>
              </span>
              <span className="text-right font-ui text-[14px] tabular-nums">{formatPrice(p.revenue)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-center text-[14px] text-ink-3">No sales in this period yet.</p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Low stock
// ---------------------------------------------------------------------------

export function LowStock({ items, total }: { items: DashboardLowStock[]; total: number }) {
  return (
    <Panel
      title="Low stock"
      description={total ? `${pluralize(total, "variant")} with 3 or fewer left${total > items.length ? ` — lowest ${items.length} shown` : ""}` : undefined}
      actions={
        <Link href="/admin/products" className="inline-flex min-h-10 items-center gap-1.5 font-ui text-[13px] text-ink-2 hover:text-charcoal">
          Products
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.5} />
        </Link>
      }
      bodyClassName="p-0 md:p-0"
    >
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.variantId ?? item.productId}>
              <Link
                href={`/admin/products/${item.productId}`}
                className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-cream/50 md:px-6"
              >
                <span className="min-w-0">
                  <span className="block truncate font-ui text-[14px] font-medium">
                    {item.productName}
                    {item.variantName && <span className="font-normal text-ink-2"> — {item.variantName}</span>}
                  </span>
                  <span className="block text-[12.5px] text-ink-3">SKU {item.sku}</span>
                </span>
                {item.stock <= 0 ? <AdminBadge tone="danger">Sold out</AdminBadge> : <AdminBadge tone="warning">{item.stock} left</AdminBadge>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-10 text-center text-[14px] text-ink-3">Every variant has more than 3 in stock.</p>
      )}
    </Panel>
  );
}
