import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
// Circular with @/lib/data/cart (which dispatches here in demo mode): only use these inside functions.
import { CartError, COUPON_COOKIE, MAX_LINE_QUANTITY, type RawItem } from "@/lib/data/cart";
import { DEMO_COOKIES } from "./constants";
import { clearDemoCookie, readDemoCookie, writeDemoCookie } from "./cookies";
import { demoDb } from "./db";
import { demoProductStock } from "./pricing";

/*
 * Demo-mode bag: one per browser, kept in a cookie as compact lines
 * ({ id, p: productId, v: variantId, q: quantity }). Signing in or out keeps
 * the same bag. The rules mirror the Supabase implementation in
 * src/lib/data/cart.ts; prices are always re-derived by demo pricing.
 */

/** Short random line ids keep the cookie small (the Supabase path uses uuids). */
export const demoLineIdSchema = z.string().regex(/^[a-f0-9]{10}$/);

const linesSchema = z.array(
  z.object({
    id: demoLineIdSchema,
    p: z.uuid(),
    v: z.uuid().nullable(),
    q: z.number().int().positive(),
  }),
);

type DemoCartLine = z.infer<typeof linesSchema>[number];

/** Stands in for the cart id handed to clearCart() after checkout. */
const DEMO_CART_ID = "demo";

/** The bag's lines, oldest first. Lines for products no longer in the catalogue are dropped (like on delete cascade). */
async function readLines(): Promise<DemoCartLine[]> {
  const lines = await readDemoCookie(DEMO_COOKIES.cart, linesSchema, []);
  return lines
    .filter((l) => demoDb.product(l.p) && (l.v === null || demoDb.variant(l.v)))
    .map((l) => ({ ...l, q: Math.min(l.q, MAX_LINE_QUANTITY) }));
}

/** Server Actions only. Throws a CartError when the bag no longer fits in its cookie. */
async function writeLines(lines: DemoCartLine[]): Promise<void> {
  if (!lines.length) {
    await clearDemoCookie(DEMO_COOKIES.cart);
    return;
  }
  if (!(await writeDemoCookie(DEMO_COOKIES.cart, lines))) {
    throw new CartError("Your demo bag is full. Remove an item or check out to add more.");
  }
}

/** Raw items in the same shape as cart_items rows. Read-only, so safe while rendering. */
export async function readDemoCartItems(): Promise<RawItem[]> {
  return (await readLines()).map((l) => ({ id: l.id, product_id: l.p, variant_id: l.v, quantity: l.q }));
}

export async function demoCartItemsForCheckout() {
  const items = (await readLines()).map((l) => ({ product_id: l.p, variant_id: l.v, quantity: l.q }));
  return { cartId: items.length ? DEMO_CART_ID : null, items };
}

export async function demoCartCount(): Promise<number> {
  return (await readLines()).reduce((n, l) => n + l.q, 0);
}

/** Adds an item, validating the product/variant and capping at available stock. */
export async function demoAddCartItem(productId: string, variantId: string | null, quantity: number) {
  const product = demoDb.product(productId);
  if (!product) throw new CartError("This item is no longer available.");

  const variants = demoDb.variantsOf(productId);
  if (variants.length && !variantId) throw new CartError("Please select a size.");
  const variant = variantId ? variants.find((v) => v.id === variantId) : null;
  if (variantId && !variant) throw new CartError("This option is no longer available.");
  const available = variant ? variant.stock_quantity : demoProductStock(product);
  if (available <= 0) throw new CartError("Sorry, this is sold out.");

  const lines = await readLines();
  const existing = lines.find((l) => l.p === productId && l.v === variantId);

  const desired = (existing?.q ?? 0) + quantity;
  const capped = Math.min(desired, available, MAX_LINE_QUANTITY);
  if (existing && capped <= existing.q) {
    throw new CartError(available <= existing.q ? `Only ${available} available — all are already in your bag.` : `You can add up to ${MAX_LINE_QUANTITY} of each item.`);
  }

  await writeLines(
    existing
      ? lines.map((l) => (l === existing ? { ...l, q: capped } : l))
      : [...lines, { id: randomBytes(5).toString("hex"), p: productId, v: variantId, q: capped }],
  );
  return { added: capped - (existing?.q ?? 0), limited: capped < desired, available };
}

async function ownLine(lineId: string) {
  const lines = await readLines();
  if (!lines.length) throw new CartError("Your bag is empty.");
  const line = lines.find((l) => l.id === lineId);
  if (!line) throw new CartError("Item not found in your bag.");
  return { lines, line };
}

export async function demoUpdateCartItemQuantity(lineId: string, quantity: number) {
  const { lines, line } = await ownLine(lineId);
  await writeLines(
    quantity <= 0 ? lines.filter((l) => l !== line) : lines.map((l) => (l === line ? { ...l, q: Math.min(quantity, MAX_LINE_QUANTITY) } : l)),
  );
}

export async function demoRemoveCartItem(lineId: string) {
  const { lines, line } = await ownLine(lineId);
  await writeLines(lines.filter((l) => l !== line));
}

export async function demoCartLine(lineId: string) {
  const { line } = await ownLine(lineId);
  return { product_id: line.p, variant_id: line.v };
}

/** Empties the bag and forgets the discount code (after an order is placed). */
export async function clearDemoCart() {
  await clearDemoCookie(DEMO_COOKIES.cart);
  (await cookies()).delete(COUPON_COOKIE);
}
