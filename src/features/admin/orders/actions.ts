"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminAction } from "@/lib/admin/auth";
import { addOrderNote, changeOrderPayment, changeOrderStatus, type AdminOrderChange } from "@/lib/admin/orders";
import { DEMO_MODE } from "@/lib/demo/mode";
import { CATALOG_TAG } from "@/lib/supabase/public";
import type { ActionResult, OrderStatus, PaymentStatus } from "@/types/domain";
import { statusLabel } from "@/utils/format";
import { orderNoteSchema, orderPaymentSchema, orderStatusSchema } from "./schemas";

/*
 * Admin order changes. Each action: admin check first, then validate every
 * input (ids, statuses, text), then act. The workflow rules are enforced again
 * where the data lives (SQL functions + trigger, or the demo store).
 */

const MESSAGES: Record<Exclude<AdminOrderChange, { ok: true }>["code"], string> = {
  ORDER_NOT_FOUND: "This order no longer exists.",
  ORDER_CHANGED: "Someone else updated this order a moment ago. We’ve loaded the latest version — please review it and try again.",
  STATUS_UNCHANGED: "The order already has this status.",
  PAYMENT_UNCHANGED: "Nothing to save: the payment status and reference are unchanged.",
  TRANSITION_NOT_ALLOWED: "This change isn’t allowed from the order’s current status.",
  NOT_ADMIN: "Your admin session has ended. Please sign in again.",
  FAILED: "We couldn’t save that change. Please try again.",
};

function invalid(issues: { path: PropertyKey[]; message: string }[]): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) (fieldErrors[String(issue.path[0] ?? "form")] ??= []).push(issue.message);
  return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
}

/** Admin screens and the customer's own order pages show the change straight away. */
function refreshOrder(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers", "layout");
  revalidatePath("/admin");
  revalidatePath("/account/orders", "layout");
}

export async function updateOrderStatusAction(input: unknown): Promise<ActionResult<{ status: OrderStatus }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);
  const { orderId, status, expected, note } = parsed.data;

  const result = await changeOrderStatus({ orderId, status, expected, note: note || null });
  if (!result.ok) {
    if (result.code === "ORDER_CHANGED") refreshOrder(orderId);
    return { ok: false, error: MESSAGES[result.code] };
  }

  refreshOrder(orderId);
  // Cancelling puts the order's stock back on sale (database trigger).
  if (status === "cancelled" && !DEMO_MODE) {
    revalidateTag(CATALOG_TAG, "max");
    revalidatePath("/admin/products", "layout");
  }
  return { ok: true, data: { status }, message: `Order marked as ${statusLabel(status).toLowerCase()}.` };
}

export async function updateOrderPaymentAction(input: unknown): Promise<ActionResult<{ paymentStatus: PaymentStatus }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsed = orderPaymentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);
  const { orderId, paymentStatus, expected, reference } = parsed.data;

  const result = await changeOrderPayment({ orderId, paymentStatus, expected, reference: reference || null });
  if (!result.ok) {
    if (result.code === "ORDER_CHANGED") refreshOrder(orderId);
    return { ok: false, error: MESSAGES[result.code] };
  }

  refreshOrder(orderId);
  return {
    ok: true,
    data: { paymentStatus },
    message: paymentStatus === expected ? "Payment reference saved." : `Payment marked as ${statusLabel(paymentStatus).toLowerCase()}.`,
  };
}

export async function addOrderNoteAction(input: unknown): Promise<ActionResult> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsed = orderNoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues);

  const result = await addOrderNote(parsed.data);
  if (!result.ok) return { ok: false, error: MESSAGES[result.code] };

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true, data: undefined, message: "Note added." };
}
