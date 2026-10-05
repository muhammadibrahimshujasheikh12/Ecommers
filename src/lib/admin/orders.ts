import "server-only";
import { createHash } from "node:crypto";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAdminUser, type AdminUser } from "@/lib/admin/auth";
import { DEMO_MODE } from "@/lib/demo/mode";
import { adminDemoOrder, adminDemoOrders, type DemoOrderView } from "@/lib/demo/orders";
import {
  adminDemoOrderNotes,
  demoAdminAddOrderNote,
  demoAdminSetOrderStatus,
  demoAdminSetPayment,
  type DemoOrderChangeCode,
} from "@/lib/demo/admin-orders";
import { demoUserId } from "@/lib/demo/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ADMIN_PAGE_SIZE,
  ORDER_SORTS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderSort,
} from "@/features/admin/orders/status";
import { addDays, zonedDayStart } from "@/features/admin/orders/time";
import type { OrderAddress, OrderDetail, OrderStatus, PaymentStatus } from "@/types/domain";

/*
 * Admin order data for both modes. Pages call these after requireAdminPage()
 * and Server Actions after requireAdminAction(); each function also re-checks
 * admin access itself. With Supabase every query runs as the signed-in admin
 * (RLS + public.is_admin() inside the admin_* SQL functions) — never with the
 * service role.
 */

// ---------------------------------------------------------------------------
// Shared helpers (also used by ./dashboard.ts and ./customers.ts)
// ---------------------------------------------------------------------------

/** Throws unless the request comes from an admin. */
export async function assertAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Admin access required");
  return admin;
}

export type AdminFunction =
  | "admin_orders"
  | "admin_update_order_status"
  | "admin_update_order_payment"
  | "admin_add_order_note"
  | "admin_dashboard_stats"
  | "admin_customers"
  | "admin_customer";

type RpcResult<T> = { data: T | null; error: PostgrestError | null };
type UntypedRpc = { rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<RpcResult<unknown>> };

/**
 * Calls an admin SQL function (20261005000100_admin_reporting.sql) as the
 * signed-in admin. Typed locally until src/types/database.ts is regenerated.
 */
export async function adminRpc<T>(fn: AdminFunction, args: Record<string, unknown>): Promise<RpcResult<T>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await (supabase as unknown as UntypedRpc).rpc(fn, args);
  return { data: data as T | null, error };
}

/** Same id as public.admin_customers() gives a guest: md5('guest:' || lower(email))::uuid. */
export function guestCustomerId(email: string): string {
  const h = createHash("md5").update(`guest:${email.trim().toLowerCase()}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Demo customers are identified by email (the demo account id for that email). */
export const demoCustomerId = (email: string) => demoUserId(email);

/** Words that must all appear in a record (case-insensitive). */
export function searchTerms(q: string): string[] {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
}

export const matchesTerms = (haystack: (string | null | undefined)[], terms: string[]) => {
  if (!terms.length) return true;
  const text = haystack.filter(Boolean).join(" ").toLowerCase();
  return terms.every((t) => text.includes(t));
};

const nameOf = (a: Partial<OrderAddress> | null | undefined) =>
  [a?.first_name, a?.last_name].filter(Boolean).join(" ").trim() || null;

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type AdminOrderFilters = {
  q: string;
  status: OrderStatus | null;
  payment: PaymentStatus | null;
  /** Store-local days, inclusive. */
  from: string | null;
  to: string | null;
  sort: OrderSort;
  page: number;
};

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  email: string;
  customerName: string | null;
  itemCount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
};

export type AdminOrderPage = { rows: AdminOrderRow[]; total: number; page: number; pageSize: number; pageCount: number };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const filtersSchema = z.object({
  q: z.string().catch(""),
  status: z.enum(ORDER_STATUSES).nullable().catch(null),
  payment: z.enum(PAYMENT_STATUSES).nullable().catch(null),
  from: z.iso.date().nullable().catch(null),
  to: z.iso.date().nullable().catch(null),
  sort: z.enum(ORDER_SORTS).catch("newest"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

/** Validates list filters from the URL; anything malformed falls back to its default. */
export function parseOrderFilters(sp: SearchParams): AdminOrderFilters {
  const f = filtersSchema.parse({
    q: (first(sp.q) ?? "").trim().slice(0, 100),
    status: first(sp.status) || null,
    payment: first(sp.payment) || null,
    from: first(sp.from) || null,
    to: first(sp.to) || null,
    sort: first(sp.sort) || "newest",
    page: first(sp.page) ?? 1,
  });
  // A reversed range is almost certainly a slip; read it the right way round.
  if (f.from && f.to && f.from > f.to) [f.from, f.to] = [f.to, f.from];
  return f;
}

const SORTERS: Record<OrderSort, (a: AdminOrderRow, b: AdminOrderRow) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  total_desc: (a, b) => b.total - a.total || b.createdAt.localeCompare(a.createdAt),
  total_asc: (a, b) => a.total - b.total || b.createdAt.localeCompare(a.createdAt),
};

function demoRow(o: DemoOrderView): AdminOrderRow {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    email: o.email,
    customerName: nameOf(o.shippingAddress),
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
  };
}

type AdminOrdersRpcRow = {
  id: string;
  order_number: string;
  created_at: string;
  email: string;
  customer_name: string | null;
  user_id: string | null;
  item_count: number;
  total: number | string;
  payment_method: string;
  payment_status: PaymentStatus;
  status: OrderStatus;
  total_count: number | string;
};

export async function listAdminOrders(filters: AdminOrderFilters): Promise<AdminOrderPage> {
  await assertAdmin();
  const pageSize = ADMIN_PAGE_SIZE;
  const from = filters.from ? zonedDayStart(filters.from) : null;
  const to = filters.to ? zonedDayStart(addDays(filters.to, 1)) : null;

  if (DEMO_MODE) {
    const terms = searchTerms(filters.q);
    const rows = adminDemoOrders()
      .filter((o) => {
        const at = Date.parse(o.createdAt);
        return (
          (!filters.status || o.status === filters.status) &&
          (!filters.payment || o.paymentStatus === filters.payment) &&
          (!from || at >= from.getTime()) &&
          (!to || at < to.getTime()) &&
          matchesTerms(
            [
              o.orderNumber,
              o.email,
              o.phone,
              nameOf(o.shippingAddress),
              nameOf(o.billingAddress),
            ],
            terms,
          )
        );
      })
      .map(demoRow)
      .sort(SORTERS[filters.sort]);
    const start = (filters.page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), total: rows.length, page: filters.page, pageSize, pageCount: Math.ceil(rows.length / pageSize) };
  }

  const args = {
    p_query: filters.q || null,
    p_status: filters.status,
    p_payment_status: filters.payment,
    p_from: from?.toISOString() ?? null,
    p_to: to?.toISOString() ?? null,
    p_sort: filters.sort,
  };
  const { data, error } = await adminRpc<AdminOrdersRpcRow[]>("admin_orders", {
    ...args,
    p_limit: pageSize,
    p_offset: (filters.page - 1) * pageSize,
  });
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  const rows = data ?? [];
  let total = Number(rows[0]?.total_count ?? 0);
  if (!rows.length && filters.page > 1) {
    // Past the last page: still report how many orders match.
    const { data: firstRow } = await adminRpc<AdminOrdersRpcRow[]>("admin_orders", { ...args, p_limit: 1, p_offset: 0 });
    total = Number(firstRow?.[0]?.total_count ?? 0);
  }
  return {
    rows: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      createdAt: r.created_at,
      email: r.email,
      customerName: r.customer_name,
      itemCount: Number(r.item_count),
      total: Number(r.total),
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      status: r.status,
    })),
    total,
    page: filters.page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export type AdminOrderNote = {
  id: string;
  body: string;
  kind: "note" | "payment";
  authorName: string;
  createdAt: string;
};

export type AdminOrderItem = OrderDetail["items"][number] & { productId: string | null; variantId: string | null };

export type AdminOrderDetail = Omit<OrderDetail, "items"> & {
  /** "seed"/"live" in the demo store, "database" with Supabase. */
  source: "seed" | "live" | "database";
  userId: string | null;
  /** Link target for /admin/customers/[id]. */
  customerId: string;
  customerName: string | null;
  paymentReference: string | null;
  items: AdminOrderItem[];
  internalNotes: AdminOrderNote[];
};

export const isOrderId = (id: string) => z.guid().safeParse(id).success;

type AdminDetailRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_reference: string | null;
  shipping_method_name: string | null;
  subtotal: number | string;
  discount: number | string;
  shipping_cost: number | string;
  tax: number | string;
  total: number | string;
  currency: string;
  coupon_code: string | null;
  shipping_address: unknown;
  billing_address: unknown;
  notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    product_slug: string | null;
    image_url: string | null;
    sku: string;
    variant_name: string | null;
    size: string | null;
    color: string | null;
    price: number | string;
    quantity: number;
    line_total: number | string | null;
  }[];
  order_status_history: { status: OrderStatus; note: string | null; created_at: string }[];
};

type NoteRow = { id: string; body: string; kind: "note" | "payment"; author_name: string; created_at: string };

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  await assertAdmin();
  if (!isOrderId(id)) return null;

  if (DEMO_MODE) {
    const view = adminDemoOrder(id);
    if (!view) return null;
    return {
      ...view,
      customerId: demoCustomerId(view.email),
      customerName: nameOf(view.shippingAddress),
      internalNotes: adminDemoOrderNotes(id),
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, notes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, order_number, user_id, email, phone, status, payment_status, payment_method, payment_reference,
         shipping_method_name, subtotal, discount, shipping_cost, tax, total, currency, coupon_code,
         shipping_address, billing_address, notes, created_at,
         order_items ( id, product_id, variant_id, product_name, product_slug, image_url, sku, variant_name, size, color, price, quantity, line_total ),
         order_status_history ( status, note, created_at )`,
      )
      .eq("id", id)
      .maybeSingle()
      .overrideTypes<AdminDetailRow, { merge: false }>(),
    // order_notes is not in the generated types yet (see the migration).
    (supabase as unknown as SupabaseClient)
      .from("order_notes")
      .select("id, body, kind, author_name, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (error) throw new Error(`Could not load order: ${error.message}`);
  if (!data) return null;
  if (notes.error) throw new Error(`Could not load order notes: ${notes.error.message}`);

  const shippingAddress = data.shipping_address as OrderAddress;
  return {
    source: "database",
    id: data.id,
    orderNumber: data.order_number,
    userId: data.user_id,
    customerId: data.user_id ?? guestCustomerId(data.email),
    customerName: nameOf(shippingAddress),
    email: data.email,
    phone: data.phone,
    status: data.status,
    paymentStatus: data.payment_status,
    paymentMethod: data.payment_method,
    paymentReference: data.payment_reference,
    shippingMethodName: data.shipping_method_name,
    subtotal: Number(data.subtotal),
    discount: Number(data.discount),
    shippingCost: Number(data.shipping_cost),
    tax: Number(data.tax),
    total: Number(data.total),
    currency: data.currency,
    couponCode: data.coupon_code,
    shippingAddress,
    billingAddress: data.billing_address as OrderAddress,
    notes: data.notes,
    createdAt: data.created_at,
    items: data.order_items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id,
      productName: i.product_name,
      productSlug: i.product_slug,
      imageUrl: i.image_url,
      sku: i.sku,
      variantName: i.variant_name,
      size: i.size,
      color: i.color,
      price: Number(i.price),
      quantity: i.quantity,
      lineTotal: Number(i.line_total ?? Number(i.price) * i.quantity),
    })),
    history: [...data.order_status_history]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((h) => ({ status: h.status, note: h.note, createdAt: h.created_at })),
    internalNotes: ((notes.data ?? []) as NoteRow[]).map((n) => ({
      id: n.id,
      body: n.body,
      kind: n.kind,
      authorName: n.author_name,
      createdAt: n.created_at,
    })),
  };
}

// ---------------------------------------------------------------------------
// Changes — inputs are validated by the Server Actions before they get here
// ---------------------------------------------------------------------------

export type AdminOrderChangeCode = DemoOrderChangeCode | "NOT_ADMIN" | "FAILED";
export type AdminOrderChange = { ok: true } | { ok: false; code: AdminOrderChangeCode };

const KNOWN_CODES = new Set<string>([
  "ORDER_NOT_FOUND",
  "ORDER_CHANGED",
  "STATUS_UNCHANGED",
  "PAYMENT_UNCHANGED",
  "TRANSITION_NOT_ALLOWED",
  "NOT_ADMIN",
]);

function fromRpcError(fn: AdminFunction, error: PostgrestError): AdminOrderChange {
  if (KNOWN_CODES.has(error.message)) return { ok: false, code: error.message as AdminOrderChangeCode };
  if (error.code === "42501") return { ok: false, code: "NOT_ADMIN" };
  console.error(`${fn} failed`, error.message, error.details);
  return { ok: false, code: "FAILED" };
}

export async function changeOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  expected: OrderStatus;
  note: string | null;
}): Promise<AdminOrderChange> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminSetOrderStatus(input.orderId, input.status, input.expected, input.note);
  const { error } = await adminRpc("admin_update_order_status", {
    p_order_id: input.orderId,
    p_status: input.status,
    p_note: input.note,
    p_expected: input.expected,
  });
  return error ? fromRpcError("admin_update_order_status", error) : { ok: true };
}

export async function changeOrderPayment(input: {
  orderId: string;
  paymentStatus: PaymentStatus;
  expected: PaymentStatus;
  reference: string | null;
}): Promise<AdminOrderChange> {
  const admin = await assertAdmin();
  if (DEMO_MODE) return demoAdminSetPayment(input.orderId, input.paymentStatus, input.expected, input.reference, admin.name);
  const { error } = await adminRpc("admin_update_order_payment", {
    p_order_id: input.orderId,
    p_payment_status: input.paymentStatus,
    p_reference: input.reference,
    p_expected: input.expected,
  });
  return error ? fromRpcError("admin_update_order_payment", error) : { ok: true };
}

export async function addOrderNote(input: { orderId: string; body: string }): Promise<AdminOrderChange> {
  const admin = await assertAdmin();
  if (DEMO_MODE) return demoAdminAddOrderNote(input.orderId, input.body, admin.name);
  const { error } = await adminRpc("admin_add_order_note", { p_order_id: input.orderId, p_body: input.body });
  return error ? fromRpcError("admin_add_order_note", error) : { ok: true };
}
