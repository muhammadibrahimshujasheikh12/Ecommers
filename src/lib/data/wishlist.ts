import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Product ids in the signed-in user's wishlist (RLS-scoped), newest first. */
export async function getWishlistIds(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return data.map((w) => w.product_id);
}
