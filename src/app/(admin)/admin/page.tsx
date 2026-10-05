import type { Metadata } from "next";
import { AdminPageHeader, Panel, adminHref } from "@/features/admin/ui";
import { AttentionPanel, KpiRow, LowStock, RecentOrders, StatusBreakdown, TopProducts } from "@/features/admin/dashboard/panels";
import { DashboardBody, DashboardFrame, RangePicker } from "@/features/admin/dashboard/range-picker";
import { RevenueChart } from "@/features/admin/dashboard/revenue-chart";
import { formatDayShort } from "@/features/admin/orders/time";
import { requireAdminPage } from "@/lib/admin/auth";
import { DASHBOARD_RANGES, DEFAULT_RANGE, getDashboard, parseRange } from "@/lib/admin/dashboard";
import { formatPrice } from "@/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDashboardPage({ searchParams }: Props) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const days = parseRange(sp.range);
  const top = (Array.isArray(sp.top) ? sp.top[0] : sp.top) === "units" ? "units" : "revenue";
  const data = await getDashboard(days);

  const href = (params: { range?: number; top?: string }) =>
    adminHref("/admin", {
      range: (params.range ?? days) === DEFAULT_RANGE ? undefined : (params.range ?? days),
      top: (params.top ?? top) === "revenue" ? undefined : (params.top ?? top),
    });
  const rangeLabel = `Last ${days} days`;

  return (
    <DashboardFrame>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${admin.name}. Here’s how the store is doing.`}
        actions={
          <RangePicker
            active={days}
            options={DASHBOARD_RANGES.map((d) => ({ days: d, label: `${d} days`, href: href({ range: d }) }))}
          />
        }
      />

      <DashboardBody>
        <div className="space-y-6">
          <KpiRow current={data.current} previous={data.previous} days={days} />
          <p className="-mt-2 text-[12.5px] text-ink-3">
            {formatDayShort(data.range.firstDay)} – {formatDayShort(data.range.lastDay)} (Pakistan time). Revenue and average
            order exclude cancelled, returned and refunded orders.
          </p>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel title="Revenue by day" description={`${rangeLabel} · ${formatPrice(data.current.revenue)} in total`}>
              <RevenueChart key={days} days={data.daily} rangeLabel={rangeLabel} />
            </Panel>
            <StatusBreakdown byStatus={data.byStatus} range={data.range} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <RecentOrders orders={data.recentOrders} />
            <AttentionPanel openOrders={data.openOrders} pendingReviews={data.pendingReviews} lowStockCount={data.lowStockCount} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopProducts
              products={top === "units" ? data.topByUnits : data.topByRevenue}
              by={top}
              toggleHref={(by) => href({ top: by })}
            />
            <LowStock items={data.lowStock} total={data.lowStockCount} />
          </div>
        </div>
      </DashboardBody>
    </DashboardFrame>
  );
}
