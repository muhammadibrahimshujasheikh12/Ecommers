import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import type { OrderAddress, OrderDetail, OrderStatus, OrderSummary } from "@/types/domain";
import { daysAgo, demoData, demoDb, type DemoSeedOrder } from "./db";
import { demoCalculateCart } from "./pricing";
import { getDemoUser } from "./session";
import {
  addDemoOrder,
  DEMO_MAX_ADDRESSES,
  DEMO_MAX_ORDERS,
  demoOrdersForCurrentUser,
  fitsDemoAddresses,
  readDemoAddresses,
  readDemoOrders,
  writeDemoAddresses,
  type DemoAddress,
  type DemoOrder,
} from "./store";

/*
 * Demo-mode orders. Orders placed here live in the visitor's own cookie (see
 * ./store.ts); the seeded order history in demoData.orders is shown to anyone
 * signed in with a matching email. Nothing is charged, shipped or emailed and
 * stock is not decremented.
 */

/** Shown wherever a shopper may look for an order that has rolled off. */
export const DEMO_ORDERS_NOTE = `Demo store — sample orders are kept in this browser only, up to the ${DEMO_MAX_ORDERS} most recent.`;

// ---------------------------------------------------------------------------
// Placement — mirrors public.place_order()
// ---------------------------------------------------------------------------

export type PlaceDemoOrderArgs = {
  userId: string | null;
  email: string;
  phone: string;
  items: { product_id: string; variant_id: string | null; quantity: number }[];
  shippingMethod: string;
  couponCode: string | null;
  paymentMethod: string;
  shippingAddress: OrderAddress;
  /** null when billing is the same as shipping. */
  billingAddress: OrderAddress | null;
  notes: string | null;
  taxRate: number;
  initialStatus: "pending" | "confirmed";
};

type PlacedDemoOrder = { order_id: string; order_number: string; access_token: string; total: number; status: OrderStatus };

/** Same contract as the place_order RPC: error.message is one of its exception codes. */
export type PlaceDemoOrderResult =
  | { data: PlacedDemoOrder; error: null }
  | { data: null; error: { message: string; details?: string } };

const fail = (message: string, details?: string): PlaceDemoOrderResult => ({ data: null, error: { message, details } });

/** "AQ-" + 7 digits: never collides with the seeded AQ-1000xx sequence or this browser's other demo orders. */
function newOrderNumber(taken: Set<string>): string {
  let number: string;
  do number = `AQ-${randomInt(1_000_000, 10_000_000)}`;
  while (taken.has(number));
  return number;
}

/** Re-prices the items with demo pricing and saves the order in this browser. Server Actions only. */
export async function placeDemoOrder(args: PlaceDemoOrderArgs): Promise<PlaceDemoOrderResult> {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(args.email)) return fail("INVALID_EMAIL");
  if (!args.items.length) return fail("EMPTY_CART");
  if (args.items.length > 50) return fail("TOO_MANY_ITEMS");

  const code = args.couponCode?.trim().toUpperCase() || null;
  const calc = await demoCalculateCart(args.items, {
    shippingMethod: args.shippingMethod,
    couponCode: code,
    country: args.shippingAddress.country,
    userId: args.userId,
    email: args.email,
    taxRate: args.taxRate,
  });

  if (code && !calc.coupon?.valid) return fail("COUPON_INVALID", calc.coupon?.message ?? "");
  if (!calc.can_checkout) return fail("CART_INVALID", JSON.stringify(calc.errors));
  if (calc.shipping_method !== args.shippingMethod) return fail("SHIPPING_METHOD_UNAVAILABLE");

  const existing = await readDemoOrders();
  const order: DemoOrder = {
    id: randomUUID(),
    number: newOrderNumber(new Set([...existing.map((o) => o.number), ...demoData.orders.map((o) => o.order_number)])),
    token: randomUUID(),
    userId: args.userId,
    email: args.email.trim().toLowerCase(),
    phone: args.phone.trim() || null,
    status: args.initialStatus,
    paymentStatus: "pending",
    paymentMethod: args.paymentMethod,
    shippingMethod: calc.shipping_method,
    shippingMethodName: calc.shipping_method_name,
    subtotal: calc.subtotal,
    discount: calc.discount,
    shipping: calc.shipping,
    tax: calc.tax,
    total: calc.total,
    coupon: code,
    ship: args.shippingAddress,
    bill: args.billingAddress,
    notes: args.notes?.trim() || null,
    createdAt: new Date().toISOString(),
    items: calc.lines.map((l) => ({ p: l.product_id, v: l.variant_id, q: l.quantity, price: l.unit_price })),
  };

  // The oldest orders drop off to make room; one too large to keep on its own is refused.
  if (!(await addDemoOrder(order))) return fail("DEMO_ORDER_TOO_LARGE");

  return {
    data: { order_id: order.id, order_number: order.number, access_token: order.token, total: order.total, status: order.status },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Address book hooks used by checkout (signed-in demo customer)
// ---------------------------------------------------------------------------

/** One of the signed-in customer's saved addresses, shaped for an order. */
export async function findDemoOrderAddress(addressId: string): Promise<OrderAddress | null> {
  const saved = (await readDemoAddresses()).find((a) => a.id === addressId);
  if (!saved) return null;
  return {
    first_name: saved.firstName,
    last_name: saved.lastName,
    phone: saved.phone,
    address_line_1: saved.addressLine1,
    address_line_2: saved.addressLine2,
    city: saved.city,
    province: saved.province,
    postal_code: saved.postalCode,
    country: saved.country,
  };
}

/** Saves a checkout address to the signed-in customer's book (default if it is their first). Server Actions only. */
export async function saveDemoOrderAddress(address: OrderAddress): Promise<void> {
  const user = await getDemoUser();
  if (!user) return;
  const book = await readDemoAddresses();
  if (book.length >= DEMO_MAX_ADDRESSES) return;
  const saved: DemoAddress = {
    id: randomUUID(),
    firstName: address.first_name,
    lastName: address.last_name,
    phone: address.phone,
    addressLine1: address.address_line_1,
    addressLine2: address.address_line_2 ?? null,
    city: address.city,
    province: address.province ?? null,
    postalCode: address.postal_code ?? null,
    country: address.country,
    isDefault: !book.length,
  };
  // Skip it rather than let the cookie drop the oldest saved address (possibly the default) to make room.
  if (!fitsDemoAddresses(user.id, [saved, ...book])) return;
  await writeDemoAddresses([saved, ...book]);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

const FLOW: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];

/**
 * Demo orders store only their current status. place_order() records a single
 * "Order placed" entry; any later status gets the usual steps up to it.
 */
function demoHistory(order: DemoOrder): OrderDetail["history"] {
  if (order.status === "pending" || order.status === "confirmed") {
    return [{ status: order.status, note: "Order placed", createdAt: order.createdAt }];
  }
  const placedAt = Date.parse(order.createdAt);
  const at = (day: number) => new Date(Math.min(placedAt + day * 86_400_000, Date.now())).toISOString();
  const reached = FLOW.indexOf(order.status);
  const steps = reached > 0 ? FLOW.slice(0, reached + 1) : [FLOW[0], order.status];
  return steps.map((status, i) => ({ status, note: i === 0 ? "Order placed" : null, createdAt: at(i) }));
}

/** Product details are resolved from the catalogue (demo orders store ids only). */
function fromDemoOrder(order: DemoOrder): OrderDetail {
  return {
    id: order.id,
    orderNumber: order.number,
    email: order.email,
    phone: order.phone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    shippingMethodName: order.shippingMethodName,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shipping,
    tax: order.tax,
    total: order.total,
    currency: "PKR",
    couponCode: order.coupon,
    shippingAddress: order.ship,
    billingAddress: order.bill ?? order.ship,
    notes: order.notes,
    createdAt: order.createdAt,
    items: order.items.map((item, i) => {
      const product = demoDb.product(item.p);
      const variant = item.v ? demoDb.variant(item.v) : null;
      return {
        id: `${order.id}-${i}`,
        productName: product?.name ?? "Archived item",
        productSlug: product?.slug ?? null,
        imageUrl: demoDb.imagesOf(item.p)[0]?.url ?? null,
        sku: variant?.sku ?? product?.sku ?? "",
        variantName: variant?.name ?? null,
        size: variant?.size ?? null,
        color: variant?.color ?? null,
        price: item.price,
        quantity: item.q,
        lineTotal: item.price * item.q,
      };
    }),
    history: demoHistory(order),
  };
}

/** Seeded orders carry full item snapshots and history, like the database rows. */
function fromSeedOrder(order: DemoSeedOrder): OrderDetail {
  return {
    id: order.id,
    orderNumber: order.order_number,
    email: order.email,
    phone: order.phone,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    shippingMethodName: order.shipping_method_name,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shipping_cost,
    tax: order.tax,
    total: order.total,
    currency: "PKR",
    couponCode: order.coupon_code,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    notes: order.notes,
    createdAt: daysAgo(order.created_days_ago),
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.product_name,
      productSlug: i.product_slug,
      imageUrl: i.image_url,
      sku: i.sku,
      variantName: i.variant_name,
      size: i.size,
      color: i.color,
      price: i.price,
      quantity: i.quantity,
      lineTotal: i.price * i.quantity,
    })),
    history: [...order.history]
      .sort((a, b) => b.created_days_ago - a.created_days_ago)
      .map((h) => ({ status: h.status as OrderStatus, note: h.note, createdAt: daysAgo(h.created_days_ago) })),
  };
}

/** The signed-in customer's orders (placed in this browser + seeded history for their email), newest first. */
async function customerOrders(): Promise<OrderDetail[]> {
  const user = await getDemoUser();
  if (!user) return [];
  const email = user.email.toLowerCase();
  const placed = (await demoOrdersForCurrentUser()).map(fromDemoOrder);
  const seeded = demoData.orders.filter((o) => o.email.toLowerCase() === email).map(fromSeedOrder);
  return [...placed, ...seeded].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function demoGetMyOrders(limit: number): Promise<OrderSummary[]> {
  return (await customerOrders()).slice(0, limit).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: o.total,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    createdAt: o.createdAt,
    firstImage: o.items[0]?.imageUrl ?? null,
  }));
}

export async function demoGetMyOrder(orderId: string): Promise<OrderDetail | null> {
  return (await customerOrders()).find((o) => o.id === orderId) ?? null;
}

/** Any demo order placed in this browser, or a seeded one. */
export async function demoGetOrderByAccessToken(token: string): Promise<OrderDetail | null> {
  const key = token.toLowerCase();
  const placed = (await readDemoOrders()).find((o) => o.token.toLowerCase() === key);
  if (placed) return fromDemoOrder(placed);
  const seeded = demoData.orders.find((o) => o.access_token.toLowerCase() === key);
  return seeded ? fromSeedOrder(seeded) : null;
}

/** Order number and email must both match (email case-insensitively). */
export async function demoTrackOrder(orderNumber: string, email: string): Promise<OrderDetail | null> {
  const number = orderNumber.trim().toUpperCase();
  const mail = email.trim().toLowerCase();
  const matches = (orderNo: string, orderEmail: string) => orderNo.toUpperCase() === number && orderEmail.toLowerCase() === mail;
  const placed = (await readDemoOrders()).find((o) => matches(o.number, o.email));
  if (placed) return fromDemoOrder(placed);
  const seeded = demoData.orders.find((o) => matches(o.order_number, o.email));
  return seeded ? fromSeedOrder(seeded) : null;
}
