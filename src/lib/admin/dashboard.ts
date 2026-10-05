import "server-only";
import { adminRpc, assertAdmin } from "@/lib/admin/orders";
import { demoData, demoDb } from "@/lib/demo/db";
import { DEMO_MODE } from "@/lib/demo/mode";
import { adminDemoOrders } from "@/lib/demo/orders";
import { countsAsRevenue, OPEN_ORDER_STATUSES, ORDER_STATUSES, STORE_TIME_ZONE } from "@/features/admin/orders/status";
import { addDays, zonedDay, zonedDayStart } from "@/features/admin/orders/time";
import type { OrderStatus, PaymentStatus } from "@/types/domain";

/*
 * Dashboard figures, computed from real orders in both modes: in the demo
 * store from the seeded orders plus every order placed on this server; with
 * Supabase by public.admin_dashboard_stats(). Revenue counts every order
 * except cancelled, returned and refunded ones; days are store-local.
 */

export const DASHBOARD_RANGES = [7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];
export const DEFAULT_RANGE: DashboardRange = 30;
export const LOW_STOCK_THRESHOLD = 3;

export function parseRange(value: string | string[] | undefined): DashboardRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (DASHBOARD_RANGES as readonly number[]).includes(n) ? (n as DashboardRange) : DEFAULT_RANGE;
}

export type DashboardTotals = {
  revenue: number;
  /** Orders placed in the period, whatever their status. */
  orders: number;
  /** Orders that count towards revenue. */
  revenueOrders: number;
  averageOrderValue: number;
  /** Distinct customers (by email) who ordered in the period. */
  customers: number;
};

export type DashboardDay = { day: string; revenue: number; orders: number };

export type DashboardProduct = {
  productId: string | null;
  name: string;
  slug: string | null;
  imageUrl: string | null;
  units: number;
  revenue: number;
};

export type DashboardLowStock = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  stock: number;
};

export type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  email: string;
  customerName: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

export type DashboardData = {
  /** Store-local days, inclusive. */
  range: { days: DashboardRange; firstDay: string; lastDay: string };
  current: DashboardTotals;
  previous: DashboardTotals;
  daily: DashboardDay[];
  byStatus: Record<OrderStatus, number>;
  topByRevenue: DashboardProduct[];
  topByUnits: DashboardProduct[];
  openOrders: number;
  pendingReviews: number;
  lowStockCount: number;
  lowStock: DashboardLowStock[];
  recentOrders: DashboardRecentOrder[];
};

const totals = (orders: number, revenueOrders: number, revenue: number, customers: number): DashboardTotals => ({
  orders,
  revenueOrders,
  revenue,
  customers,
  averageOrderValue: revenueOrders ? revenue / revenueOrders : 0,
});

const emptyByStatus = () => Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;

export async function getDashboard(days: DashboardRange): Promise<DashboardData> {
  await assertAdmin();
  const lastDay = zonedDay(new Date());
  const firstDay = addDays(lastDay, -(days - 1));
  const from = zonedDayStart(firstDay);
  const to = zonedDayStart(addDays(lastDay, 1));
  const range = { days, firstDay, lastDay };
  return DEMO_MODE ? demoDashboard(range, from, to) : databaseDashboard(range, from, to);
}

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------

function demoDashboard(range: DashboardData["range"], from: Date, to: Date): DashboardData {
  const span = to.getTime() - from.getTime();
  const prevFrom = from.getTime() - span;
  const orders = adminDemoOrders();

  const inWindow = (start: number, end: number) =>
    orders.filter((o) => {
      const at = Date.parse(o.createdAt);
      return at >= start && at < end;
    });
  const summarize = (list: typeof orders) => {
    const counted = list.filter((o) => countsAsRevenue(o.status));
    return totals(
      list.length,
      counted.length,
      counted.reduce((n, o) => n + o.total, 0),
      new Set(list.map((o) => o.email.toLowerCase())).size,
    );
  };

  const current = inWindow(from.getTime(), to.getTime());
  const previous = inWindow(prevFrom, from.getTime());

  const daily = new Map<string, DashboardDay>();
  for (let day = range.firstDay; day <= range.lastDay; day = addDays(day, 1)) daily.set(day, { day, revenue: 0, orders: 0 });
  const byStatus = emptyByStatus();
  const products = new Map<string, DashboardProduct>();
  for (const o of current) {
    const bucket = daily.get(zonedDay(o.createdAt, STORE_TIME_ZONE));
    byStatus[o.status] += 1;
    if (bucket) bucket.orders += 1;
    if (!countsAsRevenue(o.status)) continue;
    if (bucket) bucket.revenue += o.total;
    for (const item of o.items) {
      const key = item.productId ?? item.productName;
      const product = item.productId ? demoDb.product(item.productId) : null;
      const row = products.get(key) ?? {
        productId: item.productId,
        name: product?.name ?? item.productName,
        slug: product?.slug ?? item.productSlug,
        imageUrl: (item.productId && demoDb.imagesOf(item.productId)[0]?.url) || item.imageUrl,
        units: 0,
        revenue: 0,
      };
      row.units += item.quantity;
      row.revenue += item.lineTotal;
      products.set(key, row);
    }
  }
  const productRows = [...products.values()];

  // Low stock across live (non-archived) products; a product without variants counts as one line.
  const lowStock: DashboardLowStock[] = [];
  for (const p of demoData.products) {
    if (p.status === "archived") continue;
    const variants = demoDb.variantsOf(p.id);
    if (!variants.length) {
      lowStock.push({ productId: p.id, variantId: null, productName: p.name, variantName: null, sku: p.sku, stock: 0 });
      continue;
    }
    for (const v of variants) {
      if (v.stock_quantity <= LOW_STOCK_THRESHOLD) {
        lowStock.push({ productId: p.id, variantId: v.id, productName: p.name, variantName: v.name, sku: v.sku, stock: v.stock_quantity });
      }
    }
  }
  lowStock.sort(
    (a, b) => a.stock - b.stock || a.productName.localeCompare(b.productName) || (a.variantName ?? "").localeCompare(b.variantName ?? ""),
  );

  return {
    range,
    current: summarize(current),
    previous: summarize(previous),
    daily: [...daily.values()],
    byStatus,
    topByRevenue: [...productRows].sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.name.localeCompare(b.name)).slice(0, 5),
    topByUnits: [...productRows].sort((a, b) => b.units - a.units || b.revenue - a.revenue || a.name.localeCompare(b.name)).slice(0, 5),
    openOrders: orders.filter((o) => OPEN_ORDER_STATUSES.includes(o.status)).length,
    // Seeded reviews awaiting moderation (reviews written by demo visitors stay in their own browser).
    pendingReviews: demoData.reviews.filter((r) => r.status === "pending").length,
    lowStockCount: lowStock.length,
    lowStock: lowStock.slice(0, 8),
    recentOrders: [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        email: o.email,
        customerName: [o.shippingAddress.first_name, o.shippingAddress.last_name].filter(Boolean).join(" ") || null,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
      })),
  };
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

type Num = number | string;
type RpcTotals = { orders: Num; revenue_orders: Num; revenue: Num; customers: Num };
type RpcProduct = { product_id: string | null; name: string; slug: string | null; image_url: string | null; units: Num; revenue: Num };
type DashboardRpc = {
  current: RpcTotals;
  previous: RpcTotals;
  daily: { day: string; orders: Num; revenue: Num }[];
  by_status: Partial<Record<OrderStatus, Num>>;
  top_by_revenue: RpcProduct[];
  top_by_units: RpcProduct[];
  open_orders: Num;
  pending_reviews: Num;
  low_stock_count: Num;
  low_stock: { variant_id: string | null; product_id: string; product_name: string; variant_name: string | null; sku: string; stock: Num }[];
  recent_orders: {
    id: string;
    order_number: string;
    created_at: string;
    email: string;
    customer_name: string | null;
    total: Num;
    status: OrderStatus;
    payment_status: PaymentStatus;
  }[];
};

const toTotals = (t: RpcTotals) => totals(Number(t.orders), Number(t.revenue_orders), Number(t.revenue), Number(t.customers));
const toProduct = (p: RpcProduct): DashboardProduct => ({
  productId: p.product_id,
  name: p.name,
  slug: p.slug,
  imageUrl: p.image_url,
  units: Number(p.units),
  revenue: Number(p.revenue),
});

async function databaseDashboard(range: DashboardData["range"], from: Date, to: Date): Promise<DashboardData> {
  const { data, error } = await adminRpc<DashboardRpc>("admin_dashboard_stats", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_tz: STORE_TIME_ZONE,
    p_low_stock: LOW_STOCK_THRESHOLD,
  });
  if (error || !data) throw new Error(`Could not load the dashboard: ${error?.message ?? "no data"}`);

  const byStatus = emptyByStatus();
  for (const [status, n] of Object.entries(data.by_status)) if (status in byStatus) byStatus[status as OrderStatus] = Number(n);

  return {
    range,
    current: toTotals(data.current),
    previous: toTotals(data.previous),
    daily: data.daily.map((d) => ({ day: d.day, revenue: Number(d.revenue), orders: Number(d.orders) })),
    byStatus,
    topByRevenue: data.top_by_revenue.map(toProduct),
    topByUnits: data.top_by_units.map(toProduct),
    openOrders: Number(data.open_orders),
    pendingReviews: Number(data.pending_reviews),
    lowStockCount: Number(data.low_stock_count),
    lowStock: data.low_stock.map((l) => ({
      productId: l.product_id,
      variantId: l.variant_id,
      productName: l.product_name,
      variantName: l.variant_name,
      sku: l.sku,
      stock: Number(l.stock),
    })),
    recentOrders: data.recent_orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      email: o.email,
      customerName: o.customer_name,
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.payment_status,
    })),
  };
}
