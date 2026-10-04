import "server-only";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/mode";
import { demoGetMyReview, demoGetProductReviews, demoGetReviewSummary, demoGetStoreRating } from "@/lib/demo/reviews";
import type { Review, ReviewSummary } from "@/types/domain";

export const REVIEWS_PAGE_SIZE = 6;
export const reviewsTag = (productId: string) => `reviews:${productId}`;

type ReviewRow = {
  id: string;
  rating: number;
  title: string;
  content: string;
  author_name: string;
  verified_purchase: boolean;
  status: Review["status"];
  created_at: string;
  review_images: { image_url: string; position: number }[];
};

const REVIEW_SELECT = "id, rating, title, content, author_name, verified_purchase, status, created_at, review_images ( image_url, position )";

/** Public URL for an object path in the review-images bucket. */
export function reviewImageUrl(path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  return `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/review-images/${path}`;
}

const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  rating: r.rating,
  title: r.title,
  content: r.content,
  authorName: r.author_name,
  verifiedPurchase: r.verified_purchase,
  status: r.status,
  createdAt: r.created_at,
  images: [...r.review_images].sort((a, b) => a.position - b.position).map((i) => reviewImageUrl(i.image_url)),
});

export type ReviewSort = "recent" | "highest" | "lowest";

export async function getProductReviews(
  productId: string,
  { page = 1, sort = "recent" }: { page?: number; sort?: ReviewSort } = {},
): Promise<{ reviews: Review[]; total: number }> {
  if (DEMO_MODE) return demoGetProductReviews(productId, { page, sort, pageSize: REVIEWS_PAGE_SIZE });
  const supabase = createSupabasePublicClient({ revalidate: 300, tags: [reviewsTag(productId)] });
  let query = supabase
    .from("reviews")
    .select(REVIEW_SELECT, { count: "exact" })
    .eq("product_id", productId)
    .eq("status", "approved");
  query =
    sort === "highest"
      ? query.order("rating", { ascending: false }).order("created_at", { ascending: false })
      : sort === "lowest"
        ? query.order("rating", { ascending: true }).order("created_at", { ascending: false })
        : query.order("created_at", { ascending: false });
  const from = (page - 1) * REVIEWS_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + REVIEWS_PAGE_SIZE - 1).overrideTypes<ReviewRow[], { merge: false }>();
  if (error) throw new Error(`Could not load reviews: ${error.message}`);
  return { reviews: data.map(toReview), total: count ?? 0 };
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  if (DEMO_MODE) return demoGetReviewSummary(productId);
  const supabase = createSupabasePublicClient({ revalidate: 300, tags: [reviewsTag(productId)] });
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "approved")
    .limit(5000);
  if (error) throw new Error(`Could not load review summary: ${error.message}`);
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of data) distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
  const count = data.length;
  const average = count ? data.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { average: Math.round(average * 10) / 10, count, distribution };
}

/** The signed-in user's own review of a product (any status), for editing. */
export async function getMyReview(productId: string): Promise<Review | null> {
  if (DEMO_MODE) return demoGetMyReview(productId);
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .eq("user_id", auth.user.id)
    .maybeSingle()
    .overrideTypes<ReviewRow, { merge: false }>();
  return data ? toReview(data) : null;
}

/** Store-wide rating for the homepage. */
export async function getStoreRating(): Promise<{ average: number; count: number; recent: (Review & { productName: string; productSlug: string })[] }> {
  if (DEMO_MODE) return demoGetStoreRating();
  const supabase = createSupabasePublicClient({ revalidate: 900 });
  const [{ data: all }, { data: recent }] = await Promise.all([
    supabase.from("reviews").select("rating").eq("status", "approved").limit(10000),
    supabase
      .from("reviews")
      .select(`${REVIEW_SELECT}, products ( name, slug )`)
      .eq("status", "approved")
      .gte("rating", 5)
      .order("created_at", { ascending: false })
      .limit(3)
      .overrideTypes<(ReviewRow & { products: { name: string; slug: string } | null })[], { merge: false }>(),
  ]);
  const ratings = all ?? [];
  const average = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
    recent: (recent ?? []).map((r) => ({
      ...toReview(r),
      productName: r.products?.name ?? "",
      productSlug: r.products?.slug ?? "",
    })),
  };
}
