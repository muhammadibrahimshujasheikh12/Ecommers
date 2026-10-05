import "server-only";
import { randomUUID } from "node:crypto";
import { canMoveOrder, canMovePayment } from "@/features/admin/orders/status";
import type { OrderStatus, PaymentStatus } from "@/types/domain";
import { demoData, mutateDemoData, type DemoSeedOrder } from "./db";
import { demoRegistry, putCapped, RUNTIME_LIMITS } from "./runtime";
import type { DemoOrder } from "./store";

/*
 * Demo-mode orders as the store sees them, shared by every visitor while the
 * server runs:
 *
 *   - Orders placed on this server (by any visitor) are registered here, so
 *     the demo admin sees all of them. The customer keeps a copy in their own
 *     cookie (./store.ts); reads prefer this server copy, which carries the
 *     admin's latest status, payment and history.
 *   - Seeded orders (demoData.orders) are changed in place through
 *     mutateDemoData().
 *   - Internal notes for either kind live in their own registry.
 *
 * Everything is capped (RUNTIME_LIMITS) to keep a public demo's memory bounded.
 * The admin functions below must only be called after requireAdminAction().
 */

export type DemoOrderEvent = { status: OrderStatus; note: string | null; createdAt: string };

/** An order placed on this server, with the admin's changes. */
export type DemoLiveOrder = {
  order: DemoOrder;
  history: DemoOrderEvent[];
  paymentReference: string | null;
};

export type DemoOrderNote = {
  id: string;
  body: string;
  kind: "note" | "payment";
  authorName: string;
  createdAt: string;
};

/** Seeded history rows appended by the demo admin carry an absolute timestamp. */
export type DemoSeedHistoryEntry = DemoSeedOrder["history"][number] & { at?: string };

/** Internal notes kept per order in the demo store (newest first). */
export const DEMO_NOTES_PER_ORDER = 10;

const liveOrders = () => demoRegistry("orders", () => new Map<string, DemoLiveOrder>());
const orderNotes = () => demoRegistry("order-notes", () => new Map<string, DemoOrderNote[]>());

// ---------------------------------------------------------------------------
// Orders placed on this server
// ---------------------------------------------------------------------------

/** Called once when a demo order is placed. The oldest orders drop off past RUNTIME_LIMITS.orders. */
export function registerDemoOrder(order: DemoOrder): void {
  putCapped(
    liveOrders(),
    order.id,
    {
      order: structuredClone(order),
      history: [{ status: order.status, note: "Order placed", createdAt: order.createdAt }],
      paymentReference: null,
    },
    RUNTIME_LIMITS.orders,
  );
}

/**
 * The server copy of an order from a customer's cookie. The access token must
 * match too, so a hand-edited cookie can't pull up someone else's order.
 */
export function liveDemoOrderFor(cookieOrder: Pick<DemoOrder, "id" | "token">): DemoLiveOrder | null {
  const live = liveOrders().get(cookieOrder.id);
  return live && live.order.token === cookieOrder.token ? live : null;
}

/** By access token (as unguessable as the database's access_token). */
export function findLiveDemoOrderByToken(token: string): DemoLiveOrder | null {
  const key = token.toLowerCase();
  for (const live of liveOrders().values()) if (live.order.token.toLowerCase() === key) return live;
  return null;
}

/** Order number and email must both match (case-insensitively), like public order tracking. */
export function findLiveDemoOrderByNumber(orderNumber: string, email: string): DemoLiveOrder | null {
  const number = orderNumber.trim().toUpperCase();
  const mail = email.trim().toLowerCase();
  for (const live of liveOrders().values()) {
    if (live.order.number.toUpperCase() === number && live.order.email.toLowerCase() === mail) return live;
  }
  return null;
}

/** Order numbers already used on this server. */
export function liveDemoOrderNumbers(): string[] {
  return [...liveOrders().values()].map((l) => l.order.number);
}

/** Admin only: every order placed on this server. */
export function adminLiveDemoOrders(): DemoLiveOrder[] {
  return [...liveOrders().values()];
}

/** Admin only. */
export function adminLiveDemoOrder(id: string): DemoLiveOrder | null {
  return liveOrders().get(id) ?? null;
}

// ---------------------------------------------------------------------------
// Admin changes
// ---------------------------------------------------------------------------

export type DemoOrderChangeCode =
  | "ORDER_NOT_FOUND"
  | "ORDER_CHANGED"
  | "STATUS_UNCHANGED"
  | "PAYMENT_UNCHANGED"
  | "TRANSITION_NOT_ALLOWED";

export type DemoOrderChange = { ok: true } | { ok: false; code: DemoOrderChangeCode };

const seedOrder = (id: string) => demoData.orders.find((o) => o.id === id) ?? null;

/** Admin only. Same rules as public.admin_update_order_status(). */
export function demoAdminSetOrderStatus(id: string, next: OrderStatus, expected: OrderStatus, note: string | null): DemoOrderChange {
  const now = new Date().toISOString();
  const live = liveOrders().get(id);
  const current = live ? live.order.status : seedOrder(id)?.status;
  if (!current) return { ok: false, code: "ORDER_NOT_FOUND" };
  if (current !== expected) return { ok: false, code: "ORDER_CHANGED" };
  if (current === next) return { ok: false, code: "STATUS_UNCHANGED" };
  if (!canMoveOrder(current, next)) return { ok: false, code: "TRANSITION_NOT_ALLOWED" };

  if (live) {
    live.order.status = next;
    live.history.push({ status: next, note, createdAt: now });
  } else {
    mutateDemoData((data) => {
      const order = data.orders.find((o) => o.id === id);
      if (!order) return;
      order.status = next;
      const entry: DemoSeedHistoryEntry = { status: next, note, created_days_ago: 0, at: now };
      order.history.push(entry);
    });
  }
  return { ok: true };
}

/** Admin only. Same rules as public.admin_update_order_payment(), including the logged note. */
export function demoAdminSetPayment(
  id: string,
  next: PaymentStatus,
  expected: PaymentStatus,
  reference: string | null,
  authorName: string,
): DemoOrderChange {
  const live = liveOrders().get(id);
  const seed = live ? null : seedOrder(id);
  if (!live && !seed) return { ok: false, code: "ORDER_NOT_FOUND" };
  const current = live ? live.order.paymentStatus : seed!.payment_status;
  const currentRef = (live ? live.paymentReference : seed!.payment_reference) ?? null;
  if (current !== expected) return { ok: false, code: "ORDER_CHANGED" };
  if (current === next && currentRef === reference) return { ok: false, code: "PAYMENT_UNCHANGED" };
  if (current !== next && !canMovePayment(current, next)) return { ok: false, code: "TRANSITION_NOT_ALLOWED" };

  if (live) {
    live.order.paymentStatus = next;
    live.paymentReference = reference;
  } else {
    mutateDemoData((data) => {
      const order = data.orders.find((o) => o.id === id);
      if (!order) return;
      order.payment_status = next;
      order.payment_reference = reference;
    });
  }

  const parts: string[] = [];
  if (current !== next) parts.push(`Payment marked ${next} (was ${current})`);
  if (currentRef !== reference) parts.push(reference ? `Payment reference: ${reference}` : "Payment reference removed");
  addNote(id, parts.join(" · "), "payment", authorName);
  return { ok: true };
}

/** Admin only. */
export function demoAdminAddOrderNote(id: string, body: string, authorName: string): DemoOrderChange {
  if (!liveOrders().has(id) && !seedOrder(id)) return { ok: false, code: "ORDER_NOT_FOUND" };
  addNote(id, body, "note", authorName);
  return { ok: true };
}

function addNote(orderId: string, body: string, kind: DemoOrderNote["kind"], authorName: string) {
  const note: DemoOrderNote = { id: randomUUID(), body, kind, authorName, createdAt: new Date().toISOString() };
  const notes = [note, ...(orderNotes().get(orderId) ?? [])].slice(0, DEMO_NOTES_PER_ORDER);
  putCapped(orderNotes(), orderId, notes, RUNTIME_LIMITS.orders);
}

/** Admin only: internal notes on an order, newest first. */
export function adminDemoOrderNotes(orderId: string): DemoOrderNote[] {
  return [...(orderNotes().get(orderId) ?? [])];
}
