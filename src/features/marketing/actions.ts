"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEMO_MODE } from "@/lib/demo/mode";
import { trackOrder } from "@/lib/data/orders";
import { newsletterSchema, trackOrderSchema } from "@/lib/validation/schemas";
import type { ActionResult, OrderDetail } from "@/types/domain";

export async function subscribeAction(input: unknown): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    // Honeypot filled → pretend success so bots learn nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "company")) return { ok: true, data: undefined, message: "Thank you for subscribing." };
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }
  // Demo store: there is no subscriber list to join and no email service.
  if (DEMO_MODE) return { ok: true, data: undefined, message: "Thanks! This is a demo store — your email isn’t saved and nothing will be sent." };
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing?.status === "subscribed") {
    return { ok: true, data: undefined, message: "You're already on our list — thank you!" };
  }
  const { error } = existing
    ? await admin.from("newsletter_subscribers").update({ status: "subscribed" }).eq("id", existing.id)
    : await admin.from("newsletter_subscribers").insert({ email: parsed.data.email, source: parsed.data.source ?? "website" });
  if (error && error.code !== "23505") {
    console.error("Newsletter subscribe failed", error);
    return { ok: false, error: "We couldn't subscribe you right now. Please try again." };
  }
  return { ok: true, data: undefined, message: "Welcome to our world. Look out for a note from us soon." };
}

export async function trackOrderAction(input: unknown): Promise<ActionResult<Pick<OrderDetail, "orderNumber" | "status" | "createdAt" | "history" | "shippingMethodName" | "items" | "total">>> {
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const order = await trackOrder(parsed.data.orderNumber, parsed.data.email);
  if (!order) return { ok: false, error: "We couldn't find an order with those details. Please check the order number and email." };
  const { orderNumber, status, createdAt, history, shippingMethodName, items, total } = order;
  return { ok: true, data: { orderNumber, status, createdAt, history, shippingMethodName, items, total } };
}
