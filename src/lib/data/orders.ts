import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/mode";
import { demoGetMyOrder, demoGetMyOrders, demoGetOrderByAccessToken, demoTrackOrder } from "@/lib/demo/orders";
import type { OrderAddress, OrderDetail, OrderSummary } from "@/types/domain";

const DETAIL_SELECT = `
  id, order_number, email, phone, status, payment_status, payment_method, shipping_method_name,
  subtotal, discount, shipping_cost, tax, total, currency, coupon_code,
  shipping_address, billing_address, notes, created_at,
  order_items ( id, product_name, product_slug, image_url, sku, variant_name, size, color, price, quantity, line_total ),
  order_status_history ( status, note, created_at )
` as const;

type DetailRow = {
  id: string;
  order_number: string;
  email: string;
  phone: string | null;
  status: OrderDetail["status"];
  payment_status: OrderDetail["paymentStatus"];
  payment_method: string;
  shipping_method_name: string | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: unknown;
  billing_address: unknown;
  notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    product_slug: string | null;
    image_url: string | null;
    sku: string;
    variant_name: string | null;
    size: string | null;
    color: string | null;
    price: number;
    quantity: number;
    line_total: number | null;
  }[];
  order_status_history: { status: OrderDetail["status"]; note: string | null; created_at: string }[];
};

function toDetail(row: DetailRow): OrderDetail {
  return {
    id: row.id,
    orderNumber: row.order_number,
    email: row.email,
    phone: row.phone,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    shippingMethodName: row.shipping_method_name,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shippingCost: Number(row.shipping_cost),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: row.currency,
    couponCode: row.coupon_code,
    shippingAddress: row.shipping_address as OrderAddress,
    billingAddress: row.billing_address as OrderAddress,
    notes: row.notes,
    createdAt: row.created_at,
    items: row.order_items.map((i) => ({
      id: i.id,
      productName: i.product_name,
      productSlug: i.product_slug,
      imageUrl: i.image_url,
      sku: i.sku,
      variantName: i.variant_name,
      size: i.size,
      color: i.color,
      price: Number(i.price),
      quantity: i.quantity,
      lineTotal: Number(i.line_total ?? i.price * i.quantity),
    })),
    history: [...row.order_status_history]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((h) => ({ status: h.status, note: h.note, createdAt: h.created_at })),
  };
}

/** Orders of the signed-in user (RLS: only their own rows are visible). */
export async function getMyOrders(limit = 50): Promise<OrderSummary[]> {
  if (DEMO_MODE) return demoGetMyOrders(limit);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total, created_at, order_items ( quantity, image_url )")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return data.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentStatus: o.payment_status,
    total: Number(o.total),
    itemCount: o.order_items.reduce((n, i) => n + i.quantity, 0),
    createdAt: o.created_at,
    firstImage: o.order_items[0]?.image_url ?? null,
  }));
}

/** A single order of the signed-in user, or null (also when it belongs to someone else). */
export async function getMyOrder(orderId: string): Promise<OrderDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  if (DEMO_MODE) return demoGetMyOrder(orderId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(DETAIL_SELECT)
    .eq("id", orderId)
    .maybeSingle()
    .overrideTypes<DetailRow, { merge: false }>();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? toDetail(data) : null;
}

/** Guest confirmation look-up by unguessable access token. */
export async function getOrderByAccessToken(token: string): Promise<OrderDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  if (DEMO_MODE) return demoGetOrderByAccessToken(token);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(DETAIL_SELECT)
    .eq("access_token", token)
    .maybeSingle()
    .overrideTypes<DetailRow, { merge: false }>();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? toDetail(data) : null;
}

/** Public order tracking: requires both order number and the email used. */
export async function trackOrder(orderNumber: string, email: string): Promise<OrderDetail | null> {
  if (DEMO_MODE) return demoTrackOrder(orderNumber, email);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(DETAIL_SELECT)
    .eq("order_number", orderNumber)
    .eq("email", email)
    .maybeSingle()
    .overrideTypes<DetailRow, { merge: false }>();
  if (error) throw new Error(`Could not look up order: ${error.message}`);
  return data ? toDetail(data) : null;
}
