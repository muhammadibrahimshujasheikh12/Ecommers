import "server-only";
import { randomUUID } from "node:crypto";
import type { ReviewSort } from "@/lib/data/reviews";
import type { ActionResult, Review, ReviewSummary } from "@/types/domain";
import { DEMO_COOKIES } from "./constants";
import { fitsDemoCookie } from "./cookies";
import { daysAgo, demoData, demoDb, type DemoReview } from "./db";
import { getDemoUser, type DemoUser } from "./session";
import { demoOrdersForCurrentUser, readDemoReviews, writeDemoReviews, type DemoUserReview } from "./store";

/*
 * Demo-mode reviews. Everyone sees the seeded (approved) reviews; reviews a
 * demo customer writes live in their own cookie (see ./store.ts), so they are
 * visible to that browser only. Signing in as a seeded customer (matched by
 * the email on their seeded orders) makes their seeded reviews theirs to edit;
 * an edit is stored in the cookie under the seeded review's id. Mirrors the
 * database rules: one review per product per customer, verified purchase
 * derived from the customer's orders, verified reviews publish instantly and
 * the rest wait as "pending" (visible to their author only). Photo uploads
 * are disabled in demo mode.
 */


/** Order statuses that count as a purchase (see reviews_before_write). */
const PURCHASED = new Set(["confirmed", "processing", "shipped", "delivered"]);

type Entry = { productId: string; review: Review };

/** Seeded customers' user ids by lower-cased email (from their seeded orders). */
const seededOwners = new Map<string, Set<string>>();
for (const o of demoData.orders) {
  const email = o.email.toLowerCase();
  seededOwners.set(email, (seededOwners.get(email) ?? new Set<string>()).add(o.user_id));
}

const seededOwnerIds = (user: DemoUser | null) => (user && seededOwners.get(user.email.toLowerCase())) || new Set<string>();

const fromSeed = (r: DemoReview): Entry => ({
  productId: r.product_id,
  review: {
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    authorName: r.author_name,
    verifiedPurchase: r.verified_purchase,
    status: r.status,
    createdAt: daysAgo(r.created_days_ago),
    images: [],
  },
});

/** Customers cannot self-approve: verified buyers publish instantly, the rest wait for moderation. */
const statusOf = (r: DemoUserReview): Review["status"] => (r.verified ? "approved" : "pending");

const fromCookie = (r: DemoUserReview, authorName: string): Entry => ({
  productId: r.productId,
  review: {
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    authorName: authorName || "Customer",
    verifiedPurchase: r.verified,
    status: statusOf(r),
    createdAt: r.createdAt,
    images: [],
  },
});

/** Stored reviews whose product is still in the sample catalogue (a cookie can outlive a regenerated dataset). */
const liveItems = (items: DemoUserReview[]) => items.filter((r) => demoDb.product(r.productId) && !Number.isNaN(Date.parse(r.createdAt)));

/** The signed-in customer's own reviews, any status: their cookie ones, plus seeded ones they haven't edited. */
async function myEntries(user: DemoUser | null): Promise<Entry[]> {
  if (!user) return [];
  const { authorName, items } = await readDemoReviews();
  const own = liveItems(items).map((r) => fromCookie(r, authorName));
  const reviewed = new Set(own.map((e) => e.productId));
  const owners = seededOwnerIds(user);
  const seeded = demoData.reviews.filter((r) => owners.has(r.user_id) && !reviewed.has(r.product_id)).map(fromSeed);
  return [...own, ...seeded];
}

/** Approved reviews (optionally for one product): other customers' seeded ones, plus the customer's own approved ones. */
async function approvedEntries(productId?: string): Promise<Entry[]> {
  const user = await getDemoUser();
  const owners = seededOwnerIds(user);
  const mine = await myEntries(user);
  const mineIds = new Set(mine.map((e) => e.review.id));
  const inScope = (id: string) => !productId || id === productId;
  return [
    ...demoData.reviews
      .filter((r) => r.status === "approved" && !owners.has(r.user_id) && !mineIds.has(r.id) && inScope(r.product_id))
      .map(fromSeed),
    ...mine.filter((e) => e.review.status === "approved" && inScope(e.productId)),
  ];
}

const newestFirst = (a: Review, b: Review) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);

const SORTS: Record<ReviewSort, (a: Review, b: Review) => number> = {
  recent: newestFirst,
  highest: (a, b) => b.rating - a.rating || newestFirst(a, b),
  lowest: (a, b) => a.rating - b.rating || newestFirst(a, b),
};

const averageOf = (reviews: Review[]) =>
  reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function demoGetProductReviews(
  productId: string,
  { page, sort, pageSize }: { page: number; sort: ReviewSort; pageSize: number },
): Promise<{ reviews: Review[]; total: number }> {
  const reviews = (await approvedEntries(productId)).map((e) => e.review).sort(SORTS[sort] ?? newestFirst);
  const from = (page - 1) * pageSize;
  return { reviews: reviews.slice(from, from + pageSize), total: reviews.length };
}

export async function demoGetReviewSummary(productId: string): Promise<ReviewSummary> {
  const reviews = (await approvedEntries(productId)).map((e) => e.review);
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
  return { average: averageOf(reviews), count: reviews.length, distribution };
}

export async function demoGetMyReview(productId: string): Promise<Review | null> {
  return (await myEntries(await getDemoUser())).find((e) => e.productId === productId)?.review ?? null;
}

export async function demoGetStoreRating(): Promise<{ average: number; count: number; recent: (Review & { productName: string; productSlug: string })[] }> {
  const all = await approvedEntries();
  return {
    average: averageOf(all.map((e) => e.review)),
    count: all.length,
    recent: all
      .filter((e) => e.review.rating >= 5)
      .sort((a, b) => newestFirst(a.review, b.review))
      .slice(0, 3)
      .map((e) => {
        const product = demoDb.product(e.productId);
        return { ...e.review, productName: product?.name ?? "", productSlug: product?.slug ?? "" };
      }),
  };
}

// ---------------------------------------------------------------------------
// Writes (Server Actions only; input is validated and the user checked by the caller)
// ---------------------------------------------------------------------------

/** "Hira A." — the same author name the database trigger builds from the profile. */
function authorNameOf(user: DemoUser): string {
  const last = user.lastName.trim();
  return `${user.firstName.trim()} ${last ? `${last[0]}.` : ""}`.trim() || "Customer";
}

/** A demo order placed while signed in, or a seeded order under the same email, that contains the product. */
async function hasPurchased(user: DemoUser, productId: string): Promise<boolean> {
  const email = user.email.toLowerCase();
  const seeded = demoData.orders.some(
    (o) => o.email.toLowerCase() === email && PURCHASED.has(o.status) && o.items.some((i) => i.product_id === productId),
  );
  if (seeded) return true;
  return (await demoOrdersForCurrentUser()).some((o) => PURCHASED.has(o.status) && o.items.some((i) => i.p === productId));
}

/**
 * Drops the customer's oldest other reviews until the cookie fits, so the one
 * just written is never the one lost. Null if that review alone is too large.
 */
function fitReviews(userId: string, authorName: string, items: DemoUserReview[], keepId: string): DemoUserReview[] | null {
  const kept = [...items];
  const fits = () => fitsDemoCookie(DEMO_COOKIES.reviews, { userId, authorName, items: kept });
  for (let i = kept.length - 1; i >= 0 && !fits(); i--) {
    if (kept[i].id !== keepId) kept.splice(i, 1);
  }
  return fits() ? kept : null;
}

export async function demoSubmitReview(input: {
  productId: string;
  rating: number;
  title: string;
  content: string;
}): Promise<ActionResult<{ status: "approved" | "pending" | "rejected"; updated: boolean }>> {
  const user = await getDemoUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };
  if (!demoDb.product(input.productId)) return { ok: false, error: "We couldn't save your review. Please try again." };

  const { productId, rating, title, content } = input;
  const stored = await readDemoReviews();
  const existing = (await myEntries(user)).find((e) => e.productId === productId)?.review;
  // Verified purchase is re-derived on every write, as in the database.
  const verified = await hasPurchased(user, productId);

  const review: DemoUserReview = {
    id: existing?.id ?? randomUUID(),
    productId,
    rating,
    title,
    content,
    verified,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  // Edits keep the author name, as the trigger does; a new review uses the current profile name.
  const authorName = existing ? stored.authorName || existing.authorName : authorNameOf(user);
  const next = [review, ...liveItems(stored.items).filter((r) => r.id !== review.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const kept = fitReviews(user.id, authorName, next, review.id);
  if (!kept) return { ok: false, error: "This review is too long for the demo store. Please shorten it and try again." };
  await writeDemoReviews(authorName, kept);
  return { ok: true, data: { status: statusOf(review), updated: Boolean(existing) } };
}

/** Removes the customer's own review; ids that aren't theirs are a no-op, as with the RLS-scoped delete. */
export async function demoDeleteReview(reviewId: string): Promise<ActionResult> {
  const owners = seededOwnerIds(await getDemoUser());
  // The cookie can hold edits, but not the absence of a bundled sample review.
  if (demoData.reviews.some((r) => r.id === reviewId && owners.has(r.user_id))) {
    return { ok: false, error: "Sample reviews can’t be deleted in the demo store." };
  }
  const stored = await readDemoReviews();
  const items = stored.items.filter((r) => r.id !== reviewId);
  if (items.length !== stored.items.length) await writeDemoReviews(stored.authorName, items);
  return { ok: true, data: undefined, message: "Review deleted." };
}
