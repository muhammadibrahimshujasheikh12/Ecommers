import "server-only";
import { z } from "zod";
import { DEMO_COOKIES } from "./constants";
import { readDemoCookie, writeDemoList } from "./cookies";
import { getDemoUser } from "./session";

/*
 * Shared demo-mode records kept in the visitor's cookies. Each domain module
 * (cart/checkout, account, reviews, wishlist) reads and writes through these
 * helpers so the formats stay consistent. User-scoped records carry the
 * owner's id and are ignored for anyone else signed in on the same browser.
 */

// ---------------------------------------------------------------------------
// Orders placed in demo mode (newest first)
// ---------------------------------------------------------------------------

const orderAddressSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string(),
  address_line_1: z.string(),
  address_line_2: z.string().nullable().optional(),
  city: z.string(),
  province: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string(),
});

export const demoOrderSchema = z.object({
  id: z.string(),
  number: z.string(),
  token: z.string(),
  userId: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  paymentMethod: z.string(),
  shippingMethod: z.string(),
  shippingMethodName: z.string().nullable(),
  subtotal: z.number(),
  discount: z.number(),
  shipping: z.number(),
  tax: z.number(),
  total: z.number(),
  coupon: z.string().nullable(),
  ship: orderAddressSchema,
  /** null means "same as shipping". */
  bill: orderAddressSchema.nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  /** Product details are resolved from the static demo catalogue when displayed. */
  items: z.array(z.object({ p: z.string(), v: z.string().nullable(), q: z.number().int().positive(), price: z.number() })),
});

export type DemoOrder = z.infer<typeof demoOrderSchema>;

/** Every demo order placed in this browser (guest and signed-in), newest first. */
export async function readDemoOrders(): Promise<DemoOrder[]> {
  return readDemoCookie(DEMO_COOKIES.orders, z.array(demoOrderSchema), []);
}

/** Saves a new order at the front of the list; the oldest drop off if the cookie is full. */
export async function addDemoOrder(order: DemoOrder): Promise<void> {
  const orders = await readDemoOrders();
  await writeDemoList(DEMO_COOKIES.orders, [order, ...orders.filter((o) => o.id !== order.id)]);
}

// ---------------------------------------------------------------------------
// Address book (signed-in demo customer)
// ---------------------------------------------------------------------------

export const demoAddressSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  province: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string(),
  isDefault: z.boolean(),
});

export type DemoAddress = z.infer<typeof demoAddressSchema>;

const addressBookSchema = z.object({ userId: z.string(), items: z.array(demoAddressSchema) });

/** The address book shares one small cookie, so keep it to a handful. */
export const DEMO_MAX_ADDRESSES = 6;

export async function readDemoAddresses(): Promise<DemoAddress[]> {
  const user = await getDemoUser();
  if (!user) return [];
  const book = await readDemoCookie(DEMO_COOKIES.addresses, addressBookSchema.nullable(), null);
  return book && book.userId === user.id ? book.items : [];
}

/** Replaces the signed-in customer's address book. Server Actions only. */
export async function writeDemoAddresses(items: DemoAddress[]): Promise<void> {
  const user = await getDemoUser();
  if (!user) return;
  await writeDemoList(DEMO_COOKIES.addresses, items, (kept) => ({ userId: user.id, items: kept }));
}

// ---------------------------------------------------------------------------
// Wishlist (signed-in demo customer; guests use localStorage as usual)
// ---------------------------------------------------------------------------

const wishlistSchema = z.object({ userId: z.string(), ids: z.array(z.string()) });

export async function readDemoWishlist(): Promise<string[]> {
  const user = await getDemoUser();
  if (!user) return [];
  const list = await readDemoCookie(DEMO_COOKIES.wishlist, wishlistSchema.nullable(), null);
  return list && list.userId === user.id ? list.ids : [];
}

/** Newest first. Server Actions only. */
export async function writeDemoWishlist(ids: string[]): Promise<void> {
  const user = await getDemoUser();
  if (!user) return;
  await writeDemoList(DEMO_COOKIES.wishlist, [...new Set(ids)], (kept) => ({ userId: user.id, ids: kept }));
}

// ---------------------------------------------------------------------------
// Reviews written by the signed-in demo customer
// ---------------------------------------------------------------------------

export const demoReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string(),
  content: z.string(),
  verified: z.boolean(),
  createdAt: z.string(),
});

export type DemoUserReview = z.infer<typeof demoReviewSchema>;

const reviewsSchema = z.object({ userId: z.string(), authorName: z.string(), items: z.array(demoReviewSchema) });

export async function readDemoReviews(): Promise<{ authorName: string; items: DemoUserReview[] }> {
  const user = await getDemoUser();
  if (!user) return { authorName: "", items: [] };
  const stored = await readDemoCookie(DEMO_COOKIES.reviews, reviewsSchema.nullable(), null);
  return stored && stored.userId === user.id ? stored : { authorName: "", items: [] };
}

/** Newest first. Server Actions only. */
export async function writeDemoReviews(authorName: string, items: DemoUserReview[]): Promise<void> {
  const user = await getDemoUser();
  if (!user) return;
  await writeDemoList(DEMO_COOKIES.reviews, items, (kept) => ({ userId: user.id, authorName, items: kept }));
}

// ---------------------------------------------------------------------------
// Purchases (for verified reviews and per-customer coupon limits)
// ---------------------------------------------------------------------------

/**
 * Demo orders the signed-in customer placed in this browser. (Seeded order
 * history in demoData.orders, matched by email, is merged by the orders module.)
 */
export async function demoOrdersForCurrentUser(): Promise<DemoOrder[]> {
  const user = await getDemoUser();
  if (!user) return [];
  return (await readDemoOrders()).filter((o) => o.userId === user.id);
}
