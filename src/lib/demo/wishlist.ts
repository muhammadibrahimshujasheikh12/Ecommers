import "server-only";
import type { ActionResult } from "@/types/domain";
import { demoDb } from "./db";
import { readDemoWishlist, writeDemoWishlist } from "./store";

/*
 * Demo-mode wishlist for signed-in customers, kept in their cookie (see
 * ./store.ts). Guests keep using localStorage in the client provider exactly
 * as with Supabase, and are merged in on sign-in.
 */

/**
 * Inside the wishlist cookie's 1,500-character budget (see ./cookies.ts) even
 * uncompressed: each 36-character uuid adds ~52 base64url characters, so 27 fit.
 * Staying below that means writeDemoList never evicts a saved piece silently;
 * the "full" error shows instead.
 */
const MAX_ITEMS = 25;

/** Saved ids that still exist in the sample catalogue (a cookie can outlive a regenerated dataset), newest first. */
export async function demoWishlistIds(): Promise<string[]> {
  return (await readDemoWishlist()).filter((id) => demoDb.product(id));
}

/** Server Actions only; the product id is validated and the user checked by the caller. */
export async function demoSetWishlist(productId: string, saved: boolean): Promise<ActionResult<{ saved: boolean }>> {
  const current = await demoWishlistIds();
  // Saving twice keeps the original position, like the ignore-duplicates upsert.
  if (current.includes(productId) === saved) return { ok: true, data: { saved } };
  if (saved) {
    if (!demoDb.product(productId)) return { ok: false, error: "We couldn't update your wishlist." };
    if (current.length >= MAX_ITEMS) return { ok: false, error: "Your demo wishlist is full — remove a piece to save another." };
  }
  await writeDemoWishlist(saved ? [productId, ...current] : current.filter((id) => id !== productId));
  return { ok: true, data: { saved } };
}

/** Adds a guest wishlist (newest first) ahead of the saved one. Server Actions only. */
export async function demoMergeWishlist(productIds: string[]): Promise<ActionResult<{ ids: string[] }>> {
  const current = await demoWishlistIds();
  const added = [...new Set(productIds)].filter((id) => demoDb.product(id) && !current.includes(id));
  const ids = [...added, ...current].slice(0, MAX_ITEMS);
  if (added.length) await writeDemoWishlist(ids);
  return { ok: true, data: { ids } };
}
