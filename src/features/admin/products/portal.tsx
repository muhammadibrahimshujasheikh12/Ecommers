"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Renders children at the end of <body>. Dialogs opened from inside the
 * product form use it so their inputs aren't part of that form (pressing
 * Enter in them must not save the product).
 */
export function BodyPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? createPortal(children, document.body) : null;
}
