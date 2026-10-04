"use server";

import { revalidateTag } from "next/cache";
import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { clearCart, getCartItemsForCheckout } from "@/lib/data/cart";
import { serverEnv } from "@/lib/env.server";
import { getPaymentProvider } from "@/lib/payments/registry";
import type { PaymentProvider } from "@/lib/payments/types";
import { DEMO_MODE } from "@/lib/demo/mode";
import { findDemoOrderAddress, placeDemoOrder, saveDemoOrderAddress } from "@/lib/demo/orders";
import { checkoutSchema, type AddressInput } from "@/lib/validation/schemas";
import type { ActionResult, OrderAddress } from "@/types/domain";
import type { Database, Json } from "@/types/database";

const toOrderAddress = (a: AddressInput): OrderAddress => ({
  first_name: a.firstName,
  last_name: a.lastName,
  phone: a.phone,
  address_line_1: a.addressLine1,
  address_line_2: a.addressLine2 || null,
  city: a.city,
  province: a.province || null,
  postal_code: a.postalCode || null,
  country: a.country,
});

const CART_ERROR_MESSAGES: Record<string, string> = {
  sold_out: "sold out",
  insufficient_stock: "no longer available in the quantity requested",
  unavailable: "no longer available",
  variant_required: "missing a size selection",
  invalid_quantity: "set to an invalid quantity",
};

/** Maps database exceptions from place_order() to customer-friendly messages. */
function friendlyOrderError(message: string, detail?: string): string {
  switch (message) {
    case "CART_INVALID": {
      try {
        const errors = JSON.parse(detail ?? "[]") as { code: string; available?: number }[];
        const first = errors[0];
        if (first?.code === "shipping_unavailable") return "The selected delivery method isn't available for this address.";
        if (first) return `Some items in your bag are ${CART_ERROR_MESSAGES[first.code] ?? "unavailable"}. Please review your bag.`;
      } catch {
        /* fall through */
      }
      return "Some items in your bag are no longer available. Please review your bag.";
    }
    case "COUPON_INVALID":
      return detail || "Your discount code is no longer valid.";
    case "SHIPPING_METHOD_UNAVAILABLE":
      return "The selected delivery method isn't available for this address.";
    case "EMPTY_CART":
      return "Your bag is empty.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "DEMO_ORDER_TOO_LARGE":
      return "This demo order is too large to keep in your browser. Remove an item or shorten your notes, then try again.";
    default:
      return "We couldn't place your order. Please try again.";
  }
}

export async function placeOrderAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) (fieldErrors[i.path.join(".")] ??= []).push(i.message);
    return { ok: false, error: "Please check your details and try again.", fieldErrors };
  }
  const data = parsed.data;
  const env = serverEnv();
  const user = await getCurrentUser();
  if (!user && !env.GUEST_CHECKOUT_ENABLED) return { ok: false, error: "Please sign in to complete your order." };

  const provider = getPaymentProvider(data.paymentMethod);
  if (!provider) return { ok: false, error: "This payment method isn't available." };
  if (DEMO_MODE) return placeDemoOrderAction(data, user, provider);

  const { cartId, items } = await getCartItemsForCheckout();
  if (!cartId || !items.length) return { ok: false, error: "Your bag is empty." };

  // A saved address must belong to the user — RLS guarantees it on this client.
  let shipping = toOrderAddress(data.shipping);
  if (user && data.savedAddressId) {
    const supabase = await createSupabaseServerClient();
    const { data: saved } = await supabase
      .from("addresses")
      .select("first_name, last_name, phone, address_line_1, address_line_2, city, province, postal_code, country")
      .eq("id", data.savedAddressId)
      .maybeSingle();
    if (!saved) return { ok: false, error: "That saved address could not be found." };
    shipping = { ...saved };
  }
  const billing = data.billingSameAsShipping || !data.billing ? shipping : toOrderAddress(data.billing);

  const admin = createSupabaseAdminClient();
  const args = {
    p_user_id: user?.id ?? null,
    p_email: user?.email ?? data.email,
    p_phone: data.phone,
    p_items: items as unknown as Json,
    p_shipping_method: data.shippingMethod,
    p_coupon_code: data.couponCode || null,
    p_payment_method: provider.code,
    p_payment_provider: provider.code,
    p_shipping_address: shipping as unknown as Json,
    p_billing_address: billing as unknown as Json,
    p_notes: data.notes || null,
    p_tax_rate: env.TAX_RATE,
    p_initial_status: provider.initialOrderStatus,
  } as unknown as Database["public"]["Functions"]["place_order"]["Args"];

  const { data: placed, error } = await admin.rpc("place_order", args);
  if (error) {
    console.warn("place_order rejected", error.message, error.details);
    return { ok: false, error: friendlyOrderError(error.message, error.details) };
  }
  const order = placed as { order_id: string; order_number: string; access_token: string; total: number };

  // Post-order housekeeping — failures here must not fail the order.
  await clearCart(cartId).catch((e) => console.error("Cart clear failed", e));
  if (user && data.saveAddress && !data.savedAddressId) {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
    await supabase.from("addresses").insert({ user_id: user.id, ...shipping, is_default: !count }).then(({ error: e }) => e && console.error("Address save failed", e));
  }
  if (data.marketing) {
    await admin
      .from("newsletter_subscribers")
      .upsert({ email: user?.email ?? data.email, source: "checkout", status: "subscribed" }, { onConflict: "email" });
  }
  revalidateTag(CATALOG_TAG, "max");

  const initiation = await provider.initiate({
    id: order.order_id,
    orderNumber: order.order_number,
    accessToken: order.access_token,
    total: Number(order.total),
    currency: "PKR",
    email: user?.email ?? data.email,
  });

  return {
    ok: true,
    data: { redirectTo: initiation.type === "redirect" ? initiation.url : `/checkout/confirmation/${order.access_token}` },
  };
}

/**
 * Demo mode: the same flow against the bundled catalogue. The order is priced
 * by demo pricing and saved in this browser only — no stock is reserved, no
 * payment is initiated, no newsletter sign-up is recorded and nothing is emailed.
 */
async function placeDemoOrderAction(
  data: z.output<typeof checkoutSchema>,
  user: User | null,
  provider: PaymentProvider,
): Promise<ActionResult<{ redirectTo: string }>> {
  const { cartId, items } = await getCartItemsForCheckout();
  if (!cartId || !items.length) return { ok: false, error: "Your bag is empty." };

  let shipping = toOrderAddress(data.shipping);
  if (user && data.savedAddressId) {
    const saved = await findDemoOrderAddress(data.savedAddressId);
    if (!saved) return { ok: false, error: "That saved address could not be found." };
    shipping = saved;
  }

  const { data: placed, error } = await placeDemoOrder({
    userId: user?.id ?? null,
    email: user?.email ?? data.email,
    phone: data.phone,
    items,
    shippingMethod: data.shippingMethod,
    couponCode: data.couponCode || null,
    paymentMethod: provider.code,
    shippingAddress: shipping,
    billingAddress: data.billingSameAsShipping || !data.billing ? null : toOrderAddress(data.billing),
    notes: data.notes || null,
    taxRate: serverEnv().TAX_RATE,
    initialStatus: provider.initialOrderStatus,
  });
  if (error) return { ok: false, error: friendlyOrderError(error.message, error.details) };

  await clearCart(cartId).catch((e) => console.error("Cart clear failed", e));
  if (user && data.saveAddress && !data.savedAddressId) {
    await saveDemoOrderAddress(shipping).catch((e) => console.error("Address save failed", e));
  }

  return { ok: true, data: { redirectTo: `/checkout/confirmation/${placed.access_token}` } };
}
