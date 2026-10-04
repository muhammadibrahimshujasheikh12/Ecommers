"use server";

import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { reviewsTag } from "@/lib/data/reviews";
import { reviewImagesEnabled } from "@/lib/env";
import { REVIEW_IMAGE_LIMIT, REVIEW_IMAGE_MAX_BYTES, REVIEW_IMAGE_TYPES, reviewSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/types/domain";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Creates or updates the signed-in customer's review for a product.
 * One review per product per customer (DB unique constraint); a second
 * submission edits the existing review. Verified-purchase and moderation
 * status are derived by the database trigger, never from this input.
 */
export async function submitReviewAction(formData: FormData): Promise<ActionResult<{ status: "approved" | "pending" | "rejected"; updated: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) (fieldErrors[String(i.path[0])] ??= []).push(i.message);
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const files = reviewImagesEnabled
    ? formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0)
    : [];
  if (files.length > REVIEW_IMAGE_LIMIT) return { ok: false, error: `You can add up to ${REVIEW_IMAGE_LIMIT} photos.` };
  for (const f of files) {
    if (!(REVIEW_IMAGE_TYPES as readonly string[]).includes(f.type)) return { ok: false, error: "Photos must be JPG, PNG or WebP." };
    if (f.size > REVIEW_IMAGE_MAX_BYTES) return { ok: false, error: "Each photo must be 5 MB or smaller." };
  }

  const supabase = await createSupabaseServerClient();
  const { productId, rating, title, content } = parsed.data;

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  const result = existing
    ? await supabase.from("reviews").update({ rating, title, content }).eq("id", existing.id).select("id, status").single()
    : await supabase.from("reviews").insert({ product_id: productId, user_id: user.id, rating, title, content }).select("id, status").single();

  if (result.error) {
    if (result.error.code === "23505") return { ok: false, error: "You've already reviewed this product." };
    console.error("Review save failed", result.error);
    return { ok: false, error: "We couldn't save your review. Please try again." };
  }
  const reviewId = result.data.id;

  if (files.length) {
    // Replace previous photos when new ones are uploaded.
    const { data: oldImages } = await supabase.from("review_images").select("id, image_url").eq("review_id", reviewId);
    if (oldImages?.length) {
      await supabase.storage.from("review-images").remove(oldImages.map((i) => i.image_url));
      await supabase.from("review_images").delete().eq("review_id", reviewId);
    }
    const rows: { review_id: string; image_url: string; position: number }[] = [];
    for (const [position, file] of files.entries()) {
      // Path must start with the user's id — enforced by the storage RLS policy.
      const path = `${user.id}/${reviewId}/${randomUUID()}.${EXT[file.type]}`;
      const { error } = await supabase.storage.from("review-images").upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        console.error("Review image upload failed", error);
        continue;
      }
      rows.push({ review_id: reviewId, image_url: path, position });
    }
    if (rows.length) await supabase.from("review_images").insert(rows);
  }

  revalidateTag(reviewsTag(productId), "max");
  revalidateTag(CATALOG_TAG, "max");
  return { ok: true, data: { status: result.data.status, updated: Boolean(existing) } };
}

export async function deleteReviewAction(reviewId: string, productId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const supabase = await createSupabaseServerClient();
  const { data: images } = await supabase.from("review_images").select("image_url").eq("review_id", reviewId);
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
  if (error) return { ok: false, error: "We couldn't delete your review." };
  if (images?.length) await supabase.storage.from("review-images").remove(images.map((i) => i.image_url));
  revalidateTag(reviewsTag(productId), "max");
  revalidateTag(CATALOG_TAG, "max");
  return { ok: true, data: undefined, message: "Review deleted." };
}
