"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { addToCartAction, getCartAction } from "./actions";
import type { CartView } from "@/types/domain";

type AddInput = { productId: string; variantId: string | null; quantity: number };

type CartContextValue = {
  count: number;
  cart: CartView | null;
  /** Increments on every client-side cart update. */
  revision: number;
  isOpen: boolean;
  isLoading: boolean;
  open: () => void;
  close: () => void;
  setCart: (cart: CartView) => void;
  addItem: (input: AddInput, options?: { openDrawer?: boolean }) => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

const countOf = (cart: CartView) => cart.lines.reduce((n, l) => n + l.quantity, 0);

export function CartProvider({ initialCount, children }: { initialCount: number; children: ReactNode }) {
  const toast = useToast();
  const [count, setCount] = useState(initialCount);
  const [syncedInitial, setSyncedInitial] = useState(initialCount);
  const [cart, setCartState] = useState<CartView | null>(null);
  const [revision, setRevision] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const [isLoading, startLoading] = useTransition();

  // Server re-renders (e.g. after sign-in merges carts) pass a new count.
  if (syncedInitial !== initialCount) {
    setSyncedInitial(initialCount);
    setCount(initialCount);
  }

  const setCart = useCallback((next: CartView) => {
    setCartState(next);
    setCount(countOf(next));
    setRevision((r) => r + 1);
  }, []);

  const open = useCallback(() => {
    setOpen(true);
    startLoading(async () => {
      setCart(await getCartAction());
    });
  }, [setCart]);

  const close = useCallback(() => setOpen(false), []);

  const addItem = useCallback(
    async (input: AddInput, options: { openDrawer?: boolean } = {}) => {
      const result = await addToCartAction(input);
      if (!result.ok) {
        toast({ tone: "error", message: result.error });
        return false;
      }
      setCart(result.data.cart);
      if (options.openDrawer !== false) setOpen(true);
      else toast({ message: result.data.message, action: { label: "View bag", onClick: () => setOpen(true) } });
      return true;
    },
    [setCart, toast],
  );

  const value = useMemo(
    () => ({ count, cart, revision, isOpen, isLoading, open, close, setCart, addItem }),
    [count, cart, revision, isOpen, isLoading, open, close, setCart, addItem],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
