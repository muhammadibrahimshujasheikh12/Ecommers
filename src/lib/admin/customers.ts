import "server-only";
import { z } from "zod";
import { adminRpc, assertAdmin, demoCustomerId, matchesTerms, searchTerms } from "@/lib/admin/orders";
import { DEMO_MODE } from "@/lib/demo/mode";
import { adminDemoOrders, type DemoOrderView } from "@/lib/demo/orders";
import { DEMO_ADMIN_EMAIL } from "@/lib/demo/session";
import { ADMIN_PAGE_SIZE, countsAsRevenue } from "@/features/admin/orders/status";
import type { Address, OrderAddress, OrderStatus, PaymentStatus } from "@/types/domain";

/*
 * Admin customers. With Supabase: accounts (auth.users + profiles) plus guests
 * who ordered without one, from public.admin_customers() / admin_customer().
 * In the demo store accounts live in visitors' browsers, so customers are the
 * distinct emails across the seeded orders and every order placed on this
 * server. Call only after requireAdminPage(); each function re-checks.
 */

export const CUSTOMER_SORTS = ["recent", "spent", "orders", "last_order"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];
export const CUSTOMER_SORT_LABELS: Record<CustomerSort, string> = {
  recent: "Newest customers",
  spent: "Highest spend",
  orders: "Most orders",
  last_order: "Latest order",
};

export type AdminCustomerRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  /** Has an account (false: guest checkout only). */
  registered: boolean;
  role: "customer" | "admin" | "guest";
  /** Account created, or first order for guests and demo customers. */
  joinedAt: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

export type AdminCustomerFilters = { q: string; sort: CustomerSort; page: number };
export type AdminCustomerPage = { rows: AdminCustomerRow[]; total: number; page: number; pageSize: number; pageCount: number };

export type AdminCustomerOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  total: number;
  itemCount: number;
};

export type AdminCustomerDetail = {
  customer: AdminCustomerRow;
  /** Saved address book (accounts, Supabase only; demo address books stay in visitors' browsers). */
  addresses: Address[];
  /** Distinct shipping addresses used on their orders, newest first. */
  orderAddresses: OrderAddress[];
  orders: AdminCustomerOrder[];
};

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const filtersSchema = z.object({
  q: z.string().catch(""),
  sort: z.enum(CUSTOMER_SORTS).catch("recent"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export function parseCustomerFilters(sp: SearchParams): AdminCustomerFilters {
  return filtersSchema.parse({
    q: (first(sp.q) ?? "").trim().slice(0, 100),
    sort: first(sp.sort) || "recent",
    page: first(sp.page) ?? 1,
  });
}

export const isCustomerId = (id: string) => z.guid().safeParse(id).success;

// ---------------------------------------------------------------------------
// Demo store: customers are emails
// ---------------------------------------------------------------------------

type DemoCustomer = AdminCustomerRow & { orders: DemoOrderView[] };

function demoCustomers(): DemoCustomer[] {
  const byEmail = new Map<string, DemoOrderView[]>();
  for (const o of adminDemoOrders()) {
    const email = o.email.trim().toLowerCase();
    const list = byEmail.get(email);
    if (list) list.push(o);
    else byEmail.set(email, [o]);
  }
  return [...byEmail.entries()].map(([email, list]) => {
    const orders = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latest = orders[0];
    const registered = orders.some((o) => o.userId);
    return {
      id: demoCustomerId(email),
      email,
      name: [latest.shippingAddress.first_name, latest.shippingAddress.last_name].filter(Boolean).join(" ") || null,
      phone: latest.phone ?? latest.shippingAddress.phone ?? null,
      registered,
      role: email === DEMO_ADMIN_EMAIL ? "admin" : registered ? "customer" : "guest",
      joinedAt: orders[orders.length - 1].createdAt,
      orderCount: orders.length,
      totalSpent: orders.filter((o) => countsAsRevenue(o.status)).reduce((n, o) => n + o.total, 0),
      lastOrderAt: latest.createdAt,
      orders,
    };
  });
}

const SORTERS: Record<CustomerSort, (a: AdminCustomerRow, b: AdminCustomerRow) => number> = {
  recent: (a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""),
  spent: (a, b) => b.totalSpent - a.totalSpent || (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""),
  orders: (a, b) => b.orderCount - a.orderCount || (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""),
  last_order: (a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""),
};

const stripOrders = (c: DemoCustomer): AdminCustomerRow => ({
  id: c.id,
  email: c.email,
  name: c.name,
  phone: c.phone,
  registered: c.registered,
  role: c.role,
  joinedAt: c.joinedAt,
  orderCount: c.orderCount,
  totalSpent: c.totalSpent,
  lastOrderAt: c.lastOrderAt,
});

const toCustomerOrder = (o: DemoOrderView): AdminCustomerOrder => ({
  id: o.id,
  orderNumber: o.orderNumber,
  createdAt: o.createdAt,
  status: o.status,
  paymentStatus: o.paymentStatus,
  paymentMethod: o.paymentMethod,
  total: o.total,
  itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
});

function distinctAddresses(addresses: OrderAddress[]): OrderAddress[] {
  const seen = new Set<string>();
  const out: OrderAddress[] = [];
  for (const a of addresses) {
    const key = [a.first_name, a.last_name, a.address_line_1, a.address_line_2, a.city, a.postal_code, a.country]
      .map((v) => (v ?? "").trim().toLowerCase())
      .join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

type Num = number | string;
type CustomerRpcRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  registered: boolean;
  role: string;
  joined_at: string | null;
  order_count: Num;
  total_spent: Num;
  last_order_at: string | null;
  total_count?: Num;
};

type CustomerRpcDetail = {
  customer: Omit<CustomerRpcRow, "order_count" | "total_spent" | "last_order_at">;
  addresses: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    province: string | null;
    postal_code: string | null;
    country: string;
    is_default: boolean;
  }[];
  orders: {
    id: string;
    order_number: string;
    created_at: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    total: Num;
    item_count: Num;
    shipping_address: OrderAddress;
  }[];
  order_count: Num;
  total_spent: Num;
  last_order_at: string | null;
};

const roleOf = (role: string): AdminCustomerRow["role"] => (role === "admin" ? "admin" : role === "guest" ? "guest" : "customer");

function toRow(r: CustomerRpcRow): AdminCustomerRow {
  return {
    id: r.id,
    email: r.email,
    name: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || null,
    phone: r.phone,
    registered: r.registered,
    role: roleOf(r.role),
    joinedAt: r.joined_at,
    orderCount: Number(r.order_count),
    totalSpent: Number(r.total_spent),
    lastOrderAt: r.last_order_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listAdminCustomers(filters: AdminCustomerFilters): Promise<AdminCustomerPage> {
  await assertAdmin();
  const pageSize = ADMIN_PAGE_SIZE;

  if (DEMO_MODE) {
    const terms = searchTerms(filters.q);
    const rows = demoCustomers()
      .filter((c) => matchesTerms([c.email, c.name, c.phone], terms))
      .map(stripOrders)
      .sort(SORTERS[filters.sort]);
    const start = (filters.page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), total: rows.length, page: filters.page, pageSize, pageCount: Math.ceil(rows.length / pageSize) };
  }

  const args = { p_query: filters.q || null, p_sort: filters.sort };
  const { data, error } = await adminRpc<CustomerRpcRow[]>("admin_customers", {
    ...args,
    p_limit: pageSize,
    p_offset: (filters.page - 1) * pageSize,
  });
  if (error) throw new Error(`Could not load customers: ${error.message}`);
  const rows = data ?? [];
  let total = Number(rows[0]?.total_count ?? 0);
  if (!rows.length && filters.page > 1) {
    const { data: firstRow } = await adminRpc<CustomerRpcRow[]>("admin_customers", { ...args, p_limit: 1, p_offset: 0 });
    total = Number(firstRow?.[0]?.total_count ?? 0);
  }
  return { rows: rows.map(toRow), total, page: filters.page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getAdminCustomer(id: string): Promise<AdminCustomerDetail | null> {
  await assertAdmin();
  if (!isCustomerId(id)) return null;

  if (DEMO_MODE) {
    const match = demoCustomers().find((c) => c.id === id);
    if (!match) return null;
    return {
      customer: stripOrders(match),
      addresses: [],
      orderAddresses: distinctAddresses(match.orders.map((o) => o.shippingAddress)),
      orders: match.orders.map(toCustomerOrder),
    };
  }

  const { data, error } = await adminRpc<CustomerRpcDetail | null>("admin_customer", { p_id: id });
  if (error) throw new Error(`Could not load customer: ${error.message}`);
  if (!data?.customer) return null;
  return {
    customer: toRow({
      ...data.customer,
      order_count: data.order_count,
      total_spent: data.total_spent,
      last_order_at: data.last_order_at,
    }),
    addresses: data.addresses.map((a) => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      phone: a.phone,
      addressLine1: a.address_line_1,
      addressLine2: a.address_line_2,
      city: a.city,
      province: a.province,
      postalCode: a.postal_code,
      country: a.country,
      isDefault: a.is_default,
    })),
    orderAddresses: distinctAddresses(data.orders.map((o) => o.shipping_address)),
    orders: data.orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      total: Number(o.total),
      itemCount: Number(o.item_count),
    })),
  };
}
