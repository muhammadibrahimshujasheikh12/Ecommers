import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import { DEMO_MODE } from "@/lib/demo/mode";
import {
  clearDemoCart,
  demoAddCartItem,
  demoCartCount,
  demoCartItemsForCheckout,
  demoCartLine,
  demoRemoveCartItem,
  demoUpdateCartItemQuantity,
  readDemoCartItems,
} from "@/lib/demo/cart";
import { DEMO_COOKIE_SECURE } from "@/lib/demo/cookies";
import { demoPriceItems } from "@/lib/demo/pricing";
import type { CartLine, CartView, ShippingOption } from "@/types/domain";
import type { Json } from "@/types/database";

/*
 * Carts are stored in Postgres. Signed-in shoppers own a cart by user id;
 * guests are identified by an opaque random id in an httpOnly cookie.
 * Guest carts are only reachable through this server module (service role),
 * so ownership is enforced here — never trust a cart id from the browser.
 * In demo mode the bag lives in a cookie instead (see src/lib/demo/cart.ts).
 */

export const CART_COOKIE = "aq_cart";
export const COUPON_COOKIE = "aq_coupon";
export const MAX_LINE_QUANTITY = 20;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // The coupon cookie is also used in demo mode, which follows the demo cookies' setting.
  secure: DEMO_MODE ? DEMO_COOKIE_SECURE : process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 60,
};

const isSessionId = (v: string | undefined): v is string => Boolean(v && /^[a-f0-9]{48}$/.test(v));

type CartRef = { id: string };

async function findCart(): Promise<CartRef | null> {
  const admin = createSupabaseAdminClient();
  const user = await getCurrentUser();
  if (user) {
    const { data } = await admin.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    return data;
  }
  const sid = (await cookies()).get(CART_COOKIE)?.value;
  if (!isSessionId(sid)) return null;
  const { data } = await admin.from("carts").select("id").eq("session_id", sid).maybeSingle();
  return data;
}

/** Finds or creates the visitor's cart. Only call from Server Actions / Route Handlers (may set a cookie). */
async function ensureCart(): Promise<CartRef> {
  const existing = await findCart();
  if (existing) return existing;

  const admin = createSupabaseAdminClient();
  const user = await getCurrentUser();
  if (user) {
    const { data, error } = await admin
      .from("carts")
      .upsert({ user_id: user.id }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (error) throw new Error(`Could not create cart: ${error.message}`);
    return data;
  }

  const sid = randomBytes(24).toString("hex");
  const { data, error } = await admin.from("carts").insert({ session_id: sid }).select("id").single();
  if (error) throw new Error(`Could not create cart: ${error.message}`);
  (await cookies()).set(CART_COOKIE, sid, cookieOptions);
  return data;
}

export type RawItem = { id: string; product_id: string; variant_id: string | null; quantity: number };

async function getRawItems(cartId: string): Promise<RawItem[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("cart_items")
    .select("id, product_id, variant_id, quantity")
    .eq("cart_id", cartId)
    .order("created_at");
  if (error) throw new Error(`Could not load cart: ${error.message}`);
  return data;
}

export type CalcResult = {
  lines: {
    product_id: string;
    variant_id: string | null;
    quantity: number;
    name: string | null;
    slug: string | null;
    image_url: string | null;
    sku: string | null;
    variant_name: string | null;
    size: string | null;
    color: string | null;
    unit_price: number;
    compare_at_price: number | null;
    line_total: number;
    available: number;
    status: CartLine["status"];
  }[];
  item_count: number;
  subtotal: number;
  discount: number;
  coupon: CartView["coupon"];
  shipping_methods: {
    code: string;
    name: string;
    description: string | null;
    cost: number;
    base_price: number;
    free_shipping_threshold: number | null;
    min_days: number;
    max_days: number;
  }[];
  shipping_method: string | null;
  shipping_method_name: string | null;
  shipping: number;
  tax: number;
  total: number;
  can_checkout: boolean;
  errors: { code: CartLine["status"] | "shipping_unavailable"; product_id?: string; variant_id?: string | null; available?: number }[];
};

export type PricingOptions = {
  shippingMethod?: string | null;
  couponCode?: string | null;
  country?: string;
  email?: string | null;
};

/** Authoritative pricing from the database for a list of items. */
export async function priceItems(
  items: { product_id: string; variant_id: string | null; quantity: number }[],
  options: PricingOptions = {},
): Promise<CalcResult> {
  if (DEMO_MODE) return demoPriceItems(items, options);
  const admin = createSupabaseAdminClient();
  const user = await getCurrentUser();
  const { data, error } = await admin.rpc("calculate_cart", {
    p_items: items as unknown as Json,
    p_shipping_method: options.shippingMethod ?? undefined,
    p_coupon_code: options.couponCode ?? undefined,
    p_country: options.country ?? "PK",
    p_user_id: user?.id,
    p_email: options.email ?? user?.email ?? undefined,
    p_tax_rate: serverEnv().TAX_RATE,
  });
  if (error) throw new Error(`Could not price cart: ${error.message}`);
  return data as unknown as CalcResult;
}

const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? ""}`;

const EMPTY_CART: CartView = {
  lines: [],
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  coupon: null,
  shippingMethods: [],
  shippingMethod: null,
  shipping: 0,
  tax: 0,
  total: 0,
  currency: "PKR",
  canCheckout: false,
};

/** The visitor's cart items, oldest first (none when they have no cart yet). */
async function getVisitorItems(): Promise<RawItem[]> {
  const cart = await findCart();
  return cart ? getRawItems(cart.id) : [];
}

/** The visitor's cart, fully priced by the database. Only reads cookies, so it is safe while rendering. */
export async function getCart(options: PricingOptions = {}): Promise<CartView> {
  const items = DEMO_MODE ? await readDemoCartItems() : await getVisitorItems();
  if (!items.length) return EMPTY_CART;

  const couponCode = options.couponCode !== undefined ? options.couponCode : (await cookies()).get(COUPON_COOKIE)?.value;
  const calc = await priceItems(
    items.map(({ product_id, variant_id, quantity }) => ({ product_id, variant_id, quantity })),
    { ...options, couponCode },
  );

  const idByKey = new Map(items.map((i) => [lineKey(i.product_id, i.variant_id), i.id]));
  const shippingMethods: ShippingOption[] = calc.shipping_methods.map((m) => ({
    code: m.code,
    name: m.name,
    description: m.description,
    cost: Number(m.cost),
    basePrice: Number(m.base_price),
    freeShippingThreshold: m.free_shipping_threshold === null ? null : Number(m.free_shipping_threshold),
    minDays: m.min_days,
    maxDays: m.max_days,
  }));

  return {
    lines: calc.lines.map((l) => ({
      lineId: idByKey.get(lineKey(l.product_id, l.variant_id)) ?? lineKey(l.product_id, l.variant_id),
      productId: l.product_id,
      variantId: l.variant_id,
      quantity: l.quantity,
      name: l.name ?? "Unavailable item",
      slug: l.slug ?? "",
      imageUrl: l.image_url,
      sku: l.sku ?? "",
      variantName: l.variant_name,
      size: l.size,
      color: l.color,
      unitPrice: Number(l.unit_price),
      compareAtPrice: l.compare_at_price === null ? null : Number(l.compare_at_price),
      lineTotal: Number(l.line_total),
      available: l.available,
      status: l.status,
    })),
    itemCount: calc.item_count,
    subtotal: Number(calc.subtotal),
    discount: Number(calc.discount),
    coupon: calc.coupon,
    shippingMethods,
    shippingMethod: calc.shipping_method,
    shipping: Number(calc.shipping),
    tax: Number(calc.tax),
    total: Number(calc.total),
    currency: "PKR",
    canCheckout: calc.can_checkout,
  };
}

/** Raw items for order placement (prices are re-derived inside place_order). */
export async function getCartItemsForCheckout() {
  if (DEMO_MODE) return demoCartItemsForCheckout();
  const cart = await findCart();
  if (!cart) return { cartId: null, items: [] as Omit<RawItem, "id">[] };
  const items = await getRawItems(cart.id);
  return {
    cartId: cart.id,
    items: items.map(({ product_id, variant_id, quantity }) => ({ product_id, variant_id, quantity })),
  };
}

/** Cheap count for the header badge. */
export async function getCartCount(): Promise<number> {
  if (DEMO_MODE) return demoCartCount();
  const cart = await findCart();
  if (!cart) return 0;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("cart_items").select("quantity").eq("cart_id", cart.id);
  return (data ?? []).reduce((n, i) => n + i.quantity, 0);
}

export class CartError extends Error {}

/** Adds an item, validating the product/variant and capping at available stock. */
export async function addCartItem(productId: string, variantId: string | null, quantity: number) {
  if (DEMO_MODE) return demoAddCartItem(productId, variantId, quantity);
  const admin = createSupabaseAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, status, stock_quantity, product_variants ( id, stock_quantity )")
    .eq("id", productId)
    .maybeSingle();
  if (!product || product.status !== "active") throw new CartError("This item is no longer available.");

  const variants = product.product_variants ?? [];
  if (variants.length && !variantId) throw new CartError("Please select a size.");
  const variant = variantId ? variants.find((v) => v.id === variantId) : null;
  if (variantId && !variant) throw new CartError("This option is no longer available.");
  const available = variant ? variant.stock_quantity : product.stock_quantity;
  if (available <= 0) throw new CartError("Sorry, this is sold out.");

  const cart = await ensureCart();
  let query = admin.from("cart_items").select("id, quantity").eq("cart_id", cart.id).eq("product_id", productId);
  query = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);
  const { data: existing } = await query.maybeSingle();

  const desired = (existing?.quantity ?? 0) + quantity;
  const capped = Math.min(desired, available, MAX_LINE_QUANTITY);
  if (existing && capped <= existing.quantity) {
    throw new CartError(available <= existing.quantity ? `Only ${available} available — all are already in your bag.` : `You can add up to ${MAX_LINE_QUANTITY} of each item.`);
  }

  if (existing) {
    const { error } = await admin.from("cart_items").update({ quantity: capped }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin
      .from("cart_items")
      .insert({ cart_id: cart.id, product_id: productId, variant_id: variantId, quantity: capped });
    if (error) throw new Error(error.message);
  }
  return { added: capped - (existing?.quantity ?? 0), limited: capped < desired, available };
}

async function assertOwnLine(lineId: string) {
  const cart = await findCart();
  if (!cart) throw new CartError("Your bag is empty.");
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("cart_items").select("id, cart_id").eq("id", lineId).maybeSingle();
  if (!data || data.cart_id !== cart.id) throw new CartError("Item not found in your bag.");
  return admin;
}

export async function updateCartItemQuantity(lineId: string, quantity: number) {
  if (DEMO_MODE) return demoUpdateCartItemQuantity(lineId, quantity);
  const admin = await assertOwnLine(lineId);
  if (quantity <= 0) {
    await admin.from("cart_items").delete().eq("id", lineId);
    return;
  }
  const { error } = await admin
    .from("cart_items")
    .update({ quantity: Math.min(quantity, MAX_LINE_QUANTITY) })
    .eq("id", lineId);
  if (error) throw new Error(error.message);
}

export async function removeCartItem(lineId: string) {
  if (DEMO_MODE) return demoRemoveCartItem(lineId);
  const admin = await assertOwnLine(lineId);
  const { error } = await admin.from("cart_items").delete().eq("id", lineId);
  if (error) throw new Error(error.message);
}

export async function getCartLine(lineId: string) {
  if (DEMO_MODE) return demoCartLine(lineId);
  const admin = await assertOwnLine(lineId);
  const { data } = await admin.from("cart_items").select("product_id, variant_id").eq("id", lineId).single();
  return data;
}

export async function clearCart(cartId: string) {
  if (DEMO_MODE) return clearDemoCart();
  const admin = createSupabaseAdminClient();
  await admin.from("cart_items").delete().eq("cart_id", cartId);
  (await cookies()).delete(COUPON_COOKIE);
}

export async function setCouponCookie(code: string | null) {
  const store = await cookies();
  if (code) store.set(COUPON_COOKIE, code, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
  else store.delete(COUPON_COOKIE);
}

/** After sign-in: move the guest cart's items into the user's cart. */
export async function mergeGuestCart(userId: string) {
  // Demo mode keeps one bag per browser, so it simply carries over.
  if (DEMO_MODE) return;
  const store = await cookies();
  const sid = store.get(CART_COOKIE)?.value;
  if (!isSessionId(sid)) return;
  const admin = createSupabaseAdminClient();
  const { data: guest } = await admin.from("carts").select("id").eq("session_id", sid).maybeSingle();
  store.delete(CART_COOKIE);
  if (!guest) return;

  const guestItems = await getRawItems(guest.id);
  if (guestItems.length) {
    const { data: userCart, error } = await admin
      .from("carts")
      .upsert({ user_id: userId }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const existing = await getRawItems(userCart.id);
    for (const item of guestItems) {
      const match = existing.find((e) => e.product_id === item.product_id && e.variant_id === item.variant_id);
      if (match) {
        await admin
          .from("cart_items")
          .update({ quantity: Math.min(match.quantity + item.quantity, MAX_LINE_QUANTITY) })
          .eq("id", match.id);
      } else {
        await admin.from("cart_items").insert({
          cart_id: userCart.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        });
      }
    }
  }
  await admin.from("carts").delete().eq("id", guest.id);
}
