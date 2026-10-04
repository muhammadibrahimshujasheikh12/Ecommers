"use server";

import { z } from "zod";
import {
  addCartItem,
  CartError,
  getCart,
  getCartLine,
  removeCartItem,
  setCouponCookie,
  updateCartItemQuantity,
} from "@/lib/data/cart";
import { addToCartSchema, couponSchema } from "@/lib/validation/schemas";
import type { ActionResult, CartView } from "@/types/domain";

const lineIdSchema = z.uuid();

function failure(error: unknown, fallback: string): { ok: false; error: string } {
  if (error instanceof CartError) return { ok: false, error: error.message };
  console.error(fallback, error);
  return { ok: false, error: fallback };
}

export async function getCartAction(): Promise<CartView> {
  return getCart();
}

export async function addToCartAction(input: { productId: string; variantId: string | null; quantity: number }): Promise<ActionResult<{ cart: CartView; message: string }>> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please choose a size and quantity." };
  try {
    const { limited, available } = await addCartItem(parsed.data.productId, parsed.data.variantId, parsed.data.quantity);
    const cart = await getCart();
    return {
      ok: true,
      data: { cart, message: limited ? `Only ${available} available — we've added what we could.` : "Added to your bag" },
    };
  } catch (error) {
    return failure(error, "We couldn't add this item. Please try again.");
  }
}

export async function updateCartLineAction(lineId: string, quantity: number): Promise<ActionResult<CartView>> {
  if (!lineIdSchema.safeParse(lineId).success || !Number.isInteger(quantity) || quantity < 0 || quantity > 20) {
    return { ok: false, error: "Invalid quantity." };
  }
  try {
    await updateCartItemQuantity(lineId, quantity);
    return { ok: true, data: await getCart() };
  } catch (error) {
    return failure(error, "We couldn't update your bag.");
  }
}

export async function removeCartLineAction(lineId: string): Promise<ActionResult<CartView>> {
  if (!lineIdSchema.safeParse(lineId).success) return { ok: false, error: "Invalid item." };
  try {
    await removeCartItem(lineId);
    return { ok: true, data: await getCart() };
  } catch (error) {
    return failure(error, "We couldn't remove this item.");
  }
}

/** Removes the line and returns its product id so the client can save it to the wishlist (guest or user). */
export async function takeCartLineAction(lineId: string): Promise<ActionResult<{ cart: CartView; productId: string }>> {
  if (!lineIdSchema.safeParse(lineId).success) return { ok: false, error: "Invalid item." };
  try {
    const line = await getCartLine(lineId);
    if (!line) return { ok: false, error: "Item not found in your bag." };
    await removeCartItem(lineId);
    return { ok: true, data: { cart: await getCart(), productId: line.product_id } };
  } catch (error) {
    return failure(error, "We couldn't move this item.");
  }
}

export async function applyCouponAction(code: string): Promise<ActionResult<CartView>> {
  const parsed = couponSchema.safeParse({ code });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid code." };
  try {
    const cart = await getCart({ couponCode: parsed.data.code });
    if (!cart.lines.length) return { ok: false, error: "Add items to your bag first." };
    if (!cart.coupon?.valid) return { ok: false, error: cart.coupon?.message ?? "This code is not valid." };
    await setCouponCookie(parsed.data.code);
    return { ok: true, data: cart, message: `${parsed.data.code} applied` };
  } catch (error) {
    return failure(error, "We couldn't apply this code.");
  }
}

export async function removeCouponAction(): Promise<ActionResult<CartView>> {
  await setCouponCookie(null);
  return { ok: true, data: await getCart({ couponCode: null }) };
}

/** Live re-pricing during checkout (shipping method / destination / coupon). */
export async function quoteCheckoutAction(input: { shippingMethod?: string; country?: string; couponCode?: string; email?: string }): Promise<ActionResult<CartView>> {
  const schema = z.object({
    shippingMethod: z.string().max(40).optional(),
    country: z.string().regex(/^[A-Z]{2}$/).optional(),
    couponCode: z.string().trim().toUpperCase().max(32).optional(),
    email: z.string().max(254).optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    return {
      ok: true,
      data: await getCart({
        shippingMethod: parsed.data.shippingMethod || null,
        country: parsed.data.country,
        couponCode: parsed.data.couponCode || null,
        email: parsed.data.email || null,
      }),
    };
  } catch (error) {
    return failure(error, "We couldn't update your totals.");
  }
}
