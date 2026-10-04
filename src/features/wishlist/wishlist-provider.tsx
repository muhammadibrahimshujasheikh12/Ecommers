"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { guestWishlistStore } from "@/stores/local";
import { mergeWishlistAction, setWishlistAction } from "./actions";

type WishlistContextValue = {
  ids: string[];
  isAuthenticated: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string, name?: string) => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Signed-in shoppers: persisted in Supabase (optimistic UI).
 * Guests: localStorage, merged into the account on the next sign-in.
 */
export function WishlistProvider({ isAuthenticated, initialIds, children }: { isAuthenticated: boolean; initialIds: string[]; children: ReactNode }) {
  const toast = useToast();
  const guestIds = guestWishlistStore.useStore();
  const [userIds, setUserIds] = useState(initialIds);
  const [syncedInitial, setSyncedInitial] = useState(initialIds);
  const merging = useRef(false);

  if (syncedInitial !== initialIds) {
    setSyncedInitial(initialIds);
    setUserIds(initialIds);
  }

  // Merge the guest wishlist once the shopper is signed in.
  useEffect(() => {
    if (!isAuthenticated || merging.current) return;
    const pending = guestWishlistStore.get();
    if (!pending.length) return;
    merging.current = true;
    mergeWishlistAction(pending)
      .then((res) => {
        if (res.ok) {
          guestWishlistStore.set([]);
          setUserIds(res.data.ids);
        }
      })
      .finally(() => {
        merging.current = false;
      });
  }, [isAuthenticated]);

  const ids = isAuthenticated ? userIds : guestIds;

  const save = useCallback(
    async (productId: string, saved: boolean) => {
      if (!isAuthenticated) {
        const current = guestWishlistStore.get();
        guestWishlistStore.set(saved ? [productId, ...current.filter((id) => id !== productId)] : current.filter((id) => id !== productId));
        return true;
      }
      const previous = userIds;
      setUserIds(saved ? [productId, ...previous.filter((id) => id !== productId)] : previous.filter((id) => id !== productId));
      const res = await setWishlistAction(productId, saved);
      if (!res.ok) {
        setUserIds(previous);
        toast({ tone: "error", message: res.error });
        return false;
      }
      return true;
    },
    [isAuthenticated, userIds, toast],
  );

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback(
    async (productId: string, name?: string) => {
      const next = !ids.includes(productId);
      const ok = await save(productId, next);
      if (ok) {
        toast({
          message: next ? `${name ?? "Item"} saved to your wishlist` : `${name ?? "Item"} removed from your wishlist`,
          action: next ? { label: "View", href: "/wishlist" } : undefined,
        });
      }
    },
    [ids, save, toast],
  );

  const add = useCallback(async (productId: string) => void (await save(productId, true)), [save]);
  const remove = useCallback(async (productId: string) => void (await save(productId, false)), [save]);

  const value = useMemo(() => ({ ids, isAuthenticated, has, toggle, add, remove }), [ids, isAuthenticated, has, toggle, add, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
