"use server";

import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getProductBySlug, getProductsByIds } from "@/lib/data/catalog";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { ActionResult, ProductDetail, ProductSummary } from "@/types/domain";

const ids = (max: number) => z.array(z.uuid()).max(max);

/** Adds/removes a product in the signed-in user's wishlist (RLS enforces ownership). */
export async function setWishlistAction(productId: string, saved: boolean): Promise<ActionResult<{ saved: boolean }>> {
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const supabase = await createSupabaseServerClient();
  const { error } = saved
    ? await supabase.from("wishlists").upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true })
    : await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
  if (error) return { ok: false, error: "We couldn't update your wishlist." };
  return { ok: true, data: { saved } };
}

/** Merges a guest (localStorage) wishlist into the account after sign-in. */
export async function mergeWishlistAction(productIds: string[]): Promise<ActionResult<{ ids: string[] }>> {
  const parsed = ids(100).safeParse(productIds);
  if (!parsed.success) return { ok: false, error: "Invalid wishlist." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const supabase = await createSupabaseServerClient();
  if (parsed.data.length) {
    await supabase
      .from("wishlists")
      .upsert(
        parsed.data.map((product_id) => ({ user_id: user.id, product_id })),
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
  }
  const { data } = await supabase.from("wishlists").select("product_id").order("created_at", { ascending: false });
  return { ok: true, data: { ids: (data ?? []).map((w) => w.product_id) } };
}

/** Product cards for client-side lists (wishlist, recently viewed). */
export async function getProductsAction(productIds: string[]): Promise<ProductSummary[]> {
  const parsed = ids(50).safeParse(productIds);
  if (!parsed.success) return [];
  return getProductsByIds(parsed.data);
}

/** Full product details for the comparison table (max 4). */
export async function getCompareProductsAction(productIds: string[]): Promise<ProductDetail[]> {
  const parsed = ids(4).safeParse(productIds);
  if (!parsed.success || !parsed.data.length) return [];
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("products").select("id, slug").in("id", parsed.data).eq("status", "active");
  const slugById = new Map((data ?? []).map((p) => [p.id, p.slug]));
  const details = await Promise.all(parsed.data.map((id) => (slugById.get(id) ? getProductBySlug(slugById.get(id)!) : null)));
  return details.filter((d): d is ProductDetail => Boolean(d));
}
