import "server-only";
import { serverEnv } from "@/lib/env.server";
import { formatPrice } from "@/utils/format";
import type { CalcResult, PricingOptions } from "@/lib/data/cart";
import type { CartLineStatus } from "@/types/domain";
import { demoData, demoDb, type DemoProduct } from "./db";
import { getDemoUser } from "./session";
import { readDemoOrders } from "./store";

/*
 * Demo-mode pricing: a line-by-line port of public.calculate_cart()
 * (supabase/migrations/20261004000300_functions.sql) over the bundled
 * catalogue. Every total shown or "charged" in demo mode comes from here —
 * keep it in step with the SQL. Demo products are always active, demo
 * coupons have no global usage limit and every shipping method is enabled.
 */

type PriceRequest = { product_id: string; variant_id: string | null; quantity: number };

export type DemoPricingInput = {
  shippingMethod?: string | null;
  couponCode?: string | null;
  country?: string | null;
  userId?: string | null;
  email?: string | null;
  taxRate?: number;
};

/** numeric(12, 2) */
const money = (n: number) => Math.round(n * 100) / 100;

/** Product-level stock, used only when a product has no variants. The seed keeps stock on variants, so this is normally 0. */
export const demoProductStock = (product: DemoProduct) => (product as DemoProduct & { stock_quantity?: number }).stock_quantity ?? 0;

/** Times a coupon was used by this customer (by user id or email), like the coupon_usage look-up. */
async function couponUses(code: string, userId: string | null, email: string | null): Promise<number> {
  const mail = email?.toLowerCase() ?? null;
  const matches = (orderCode: string | null, orderUserId: string | null, orderEmail: string) =>
    orderCode?.toUpperCase() === code && ((userId !== null && orderUserId === userId) || (mail !== null && orderEmail.toLowerCase() === mail));
  const placed = (await readDemoOrders()).filter((o) => matches(o.coupon, o.userId, o.email)).length;
  const seeded = demoData.orders.filter((o) => matches(o.coupon_code, o.user_id, o.email)).length;
  return placed + seeded;
}

/** Authoritative demo pricing for a list of items. Same result shape as the calculate_cart RPC. */
export async function demoCalculateCart(items: PriceRequest[], input: DemoPricingInput = {}): Promise<CalcResult> {
  const taxRate = input.taxRate ?? 0;
  if (!(taxRate >= 0 && taxRate <= 1)) throw new Error("INVALID_TAX_RATE");

  const lines: CalcResult["lines"] = [];
  const errors: CalcResult["errors"] = [];
  let subtotal = 0;
  let itemCount = 0;
  let canCheckout = true;

  // 1. Lines — repeated product/variant pairs are merged, in first-seen order.
  const requests = new Map<string, PriceRequest>();
  for (const item of items) {
    const variantId = item.variant_id || null;
    const key = `${item.product_id}:${variantId ?? ""}`;
    const quantity = Math.max(item.quantity, 0);
    const existing = requests.get(key);
    if (existing) existing.quantity += quantity;
    else requests.set(key, { product_id: item.product_id, variant_id: variantId, quantity });
  }

  for (const req of requests.values()) {
    const product = demoDb.product(req.product_id);
    const candidate = req.variant_id ? demoDb.variant(req.variant_id) : null;
    const variant = candidate && candidate.product_id === req.product_id ? candidate : null;
    const hasVariants = demoDb.variantsOf(req.product_id).length > 0;
    const available = variant ? variant.stock_quantity : product ? demoProductStock(product) : 0;

    let status: CartLineStatus = "ok";
    if (!product) status = "unavailable";
    else if (req.variant_id && !variant) status = "unavailable";
    else if (!req.variant_id && hasVariants) status = "variant_required";
    else if (req.quantity < 1) status = "invalid_quantity";
    else if (available === 0) status = "sold_out";
    else if (available < req.quantity) status = "insufficient_stock";

    const unit = money(variant?.price ?? product?.price ?? 0);
    const compare = product?.compare_at_price != null && product.compare_at_price > unit ? money(product.compare_at_price) : null;

    if (status === "ok" || status === "insufficient_stock") {
      subtotal = money(subtotal + unit * req.quantity);
      itemCount += req.quantity;
    }

    if (status !== "ok") {
      canCheckout = false;
      errors.push({ product_id: req.product_id, variant_id: req.variant_id, code: status, available });
    }

    lines.push({
      product_id: req.product_id,
      variant_id: req.variant_id,
      quantity: req.quantity,
      name: product?.name ?? null,
      slug: product?.slug ?? null,
      image_url: demoDb.imagesOf(req.product_id)[0]?.url ?? null,
      sku: variant?.sku ?? product?.sku ?? null,
      variant_name: variant?.name ?? null,
      size: variant?.size ?? null,
      color: variant?.color ?? null,
      unit_price: unit,
      compare_at_price: compare,
      line_total: money(unit * req.quantity),
      available,
      status,
    });
  }

  if (!lines.length) canCheckout = false;

  // 2. Coupon ----------------------------------------------------------------
  const code = input.couponCode?.trim().toUpperCase() || null;
  let discount = 0;
  let coupon: CalcResult["coupon"] = null;
  if (code) {
    const row = demoData.coupons.find((c) => c.code.toUpperCase() === code);
    const now = Date.now();
    let message: string | null = null;

    if (!row) message = "This code is not valid.";
    else if (row.starts_at && Date.parse(row.starts_at) > now) message = "This code is not active yet.";
    else if (row.expires_at && Date.parse(row.expires_at) <= now) message = "This code has expired.";
    else if (subtotal < row.minimum_order) message = `Spend ${formatPrice(row.minimum_order)} or more to use this code.`;
    else if (row.usage_limit_per_customer !== null && (input.userId || input.email)) {
      const used = await couponUses(code, input.userId || null, input.email || null);
      if (used >= row.usage_limit_per_customer) message = "You have already used this code.";
    }

    if (row && !message) {
      discount = row.type === "percentage" ? Math.round((subtotal * row.value) / 100) : row.value;
      if (row.maximum_discount !== null) discount = Math.min(discount, row.maximum_discount);
      discount = money(Math.min(discount, subtotal));
      coupon = { code, valid: true, description: row.description, message: null };
    } else {
      coupon = { code, valid: false, description: null, message };
    }
  }

  // 3. Shipping --------------------------------------------------------------
  const country = (input.country ?? "PK").toUpperCase();
  const requested = input.shippingMethod ?? null;
  const shippingMethods: CalcResult["shipping_methods"] = [];
  let selected: { code: string; name: string; cost: number } | null = null;

  const methods = demoData.shipping_methods
    .filter((m) => m.countries === null || m.countries.includes(country))
    .sort((a, b) => a.position - b.position || a.price - b.price);
  for (const m of methods) {
    const cost =
      itemCount === 0 ? 0 : m.free_shipping_threshold !== null && subtotal - discount >= m.free_shipping_threshold ? 0 : m.price;
    shippingMethods.push({
      code: m.code,
      name: m.name,
      description: m.description,
      cost,
      base_price: m.price,
      free_shipping_threshold: m.free_shipping_threshold,
      min_days: m.min_days,
      max_days: m.max_days,
    });
    if (!selected && (requested === null || requested === m.code)) selected = { code: m.code, name: m.name, cost };
  }

  if (!selected) {
    canCheckout = false;
    errors.push({ code: "shipping_unavailable" });
  }

  // 4. Tax & total -----------------------------------------------------------
  const shipping = selected?.cost ?? 0;
  const tax = Math.round((subtotal - discount) * taxRate);

  return {
    lines,
    item_count: itemCount,
    subtotal,
    discount,
    coupon,
    shipping_methods: shippingMethods,
    shipping_method: selected?.code ?? null,
    shipping_method_name: selected?.name ?? null,
    shipping,
    tax,
    total: money(subtotal - discount + shipping + tax),
    can_checkout: canCheckout,
    errors,
  };
}

/** Demo counterpart of priceItems(): resolves the customer and tax rate the same way. */
export async function demoPriceItems(items: PriceRequest[], options: PricingOptions = {}): Promise<CalcResult> {
  const user = await getDemoUser();
  return demoCalculateCart(items, {
    shippingMethod: options.shippingMethod,
    couponCode: options.couponCode,
    country: options.country ?? "PK",
    userId: user?.id,
    email: options.email ?? user?.email,
    taxRate: serverEnv().TAX_RATE,
  });
}
