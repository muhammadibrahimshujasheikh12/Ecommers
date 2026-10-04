"use client";

import { createLocalStore, idList } from "@/hooks/use-local-storage-store";

export const COMPARE_LIMIT = 4;

/** Products selected for comparison (max 4). */
export const compareStore = createLocalStore<string[]>("auraq:compare", [], idList(COMPARE_LIMIT));

/** Recently viewed products, most recent first. */
export const recentlyViewedStore = createLocalStore<string[]>("auraq:recent", [], idList(12));

/** Guest wishlist; merged into the Supabase wishlist on sign-in. */
export const guestWishlistStore = createLocalStore<string[]>("auraq:wishlist", [], idList(100));
