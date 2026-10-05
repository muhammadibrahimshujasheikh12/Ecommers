import type { AdminBadgeTone } from "@/features/admin/ui";
import type { OrderStatus, PaymentStatus } from "@/types/domain";

/*
 * Order and payment workflow shared by the admin UI, the Server Actions and
 * the demo store. Mirrors public.order_status_transition_allowed() and
 * public.payment_status_transition_allowed() in
 * supabase/migrations/20261005000100_admin_reporting.sql — keep them in sync.
 */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const satisfies readonly PaymentStatus[];

/**
 * pending → confirmed → processing → shipped → delivered (skipping forward is
 * allowed). Cancel until shipped; return once shipped or delivered; refund
 * once delivered or returned. Cancelled and refunded are final.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "processing", "shipped", "delivered", "cancelled"],
  confirmed: ["processing", "shipped", "delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned", "refunded"],
  returned: ["refunded"],
  cancelled: [],
  refunded: [],
};

/** pending → paid | failed, failed → pending | paid, paid → refunded. Refunded is final. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ["paid", "failed"],
  failed: ["pending", "paid"],
  paid: ["refunded"],
  refunded: [],
};

export const canMoveOrder = (from: OrderStatus, to: OrderStatus) => ORDER_TRANSITIONS[from].includes(to);
export const canMovePayment = (from: PaymentStatus, to: PaymentStatus) => PAYMENT_TRANSITIONS[from].includes(to);

/** Moves that need an explicit confirmation in the UI. */
export const DESTRUCTIVE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set(["cancelled", "returned", "refunded"]);
export const DESTRUCTIVE_PAYMENT_STATUSES: ReadonlySet<PaymentStatus> = new Set(["refunded"]);

/** Orders that do not count towards revenue or "total spent". */
export const NON_REVENUE_STATUSES: ReadonlySet<OrderStatus> = new Set(["cancelled", "returned", "refunded"]);
export const countsAsRevenue = (status: OrderStatus) => !NON_REVENUE_STATUSES.has(status);

/** Orders still waiting to be fulfilled. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = ["pending", "confirmed", "processing"];

export const ORDER_STATUS_TONE: Record<OrderStatus, AdminBadgeTone> = {
  pending: "warning",
  confirmed: "neutral",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "muted",
  returned: "muted",
  refunded: "muted",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, AdminBadgeTone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  refunded: "muted",
};

/** What each move means, shown beside the status picker. */
export const ORDER_STATUS_HINTS: Record<OrderStatus, string> = {
  pending: "Awaiting confirmation or payment.",
  confirmed: "Accepted and ready to prepare.",
  processing: "Being prepared and packed.",
  shipped: "Handed to the courier.",
  delivered: "Received by the customer.",
  cancelled: "Stops the order. Reserved stock goes back on sale. This can’t be undone.",
  returned: "The customer sent the items back.",
  refunded: "The order was refunded. This can’t be undone.",
};

export const ORDER_SORTS = ["newest", "oldest", "total_desc", "total_asc"] as const;
export type OrderSort = (typeof ORDER_SORTS)[number];
export const ORDER_SORT_LABELS: Record<OrderSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  total_desc: "Highest total",
  total_asc: "Lowest total",
};

/** The store's own calendar: dashboard days and date filters use it. */
export const STORE_TIME_ZONE = "Asia/Karachi";

/** Admin list page size. */
export const ADMIN_PAGE_SIZE = 20;

export const NOTE_MAX = 1000;
export const STATUS_NOTE_MAX = 500;
export const REFERENCE_MAX = 120;
