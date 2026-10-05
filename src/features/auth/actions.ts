"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mergeGuestCart } from "@/lib/data/cart";
import { siteUrl } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/mode";
import { DEMO_PASSWORD_NOTE, demoRegister, demoSignIn } from "@/lib/demo/account";
import { signOutDemoUser } from "@/lib/demo/session";
import { safeNext } from "@/lib/safe-next";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";
import type { ActionResult } from "@/types/domain";

const fieldErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string[]> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form");
    (out[key] ??= []).push(i.message);
  }
  return out;
};

export async function loginAction(input: unknown, next?: string): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };

  if (DEMO_MODE) {
    // Any email and password signs in; nothing is checked or stored.
    const user = await demoSignIn(parsed.data.email);
    await mergeGuestCart(user.id).catch((e) => console.error("Cart merge failed", e));
    return { ok: true, data: { redirectTo: safeNext(next) ?? "/account" } };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { ok: false, error: "Please verify your email address first — check your inbox for the confirmation link." };
    }
    // Generic message: never reveal whether the email exists.
    return { ok: false, error: "The email or password you entered is incorrect." };
  }

  try {
    await mergeGuestCart(data.user.id);
  } catch (e) {
    console.error("Cart merge failed", e);
  }
  return { ok: true, data: { redirectTo: safeNext(next) ?? "/account" } };
}

export async function registerAction(input: unknown): Promise<ActionResult<{ needsVerification: boolean; redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const { email, password, firstName, lastName, marketing } = parsed.data;

  if (DEMO_MODE) {
    // No verification email or newsletter opt-in in the demo store: sign in straight away.
    const res = await demoRegister({ email, firstName, lastName });
    if (!res.ok) return res;
    await mergeGuestCart(res.data.id).catch(() => undefined);
    return { ok: true, data: { needsVerification: false, redirectTo: "/account" } };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/account`,
      data: { first_name: firstName, last_name: lastName },
    },
  });
  if (error) {
    if (error.code === "user_already_exists" || /registered/i.test(error.message)) {
      return { ok: false, error: "An account with this email already exists. Try signing in instead." };
    }
    if (error.code === "weak_password") return { ok: false, error: "Please choose a stronger password." };
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }

  if (marketing) {
    await createSupabaseAdminClient()
      .from("newsletter_subscribers")
      .upsert({ email, source: "register", status: "subscribed" }, { onConflict: "email" });
  }

  // With email confirmation enabled (recommended) there is no session yet.
  if (!data.session) return { ok: true, data: { needsVerification: true, redirectTo: "/login" } };
  if (data.user) await mergeGuestCart(data.user.id).catch(() => undefined);
  return { ok: true, data: { needsVerification: false, redirectTo: "/account" } };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address.", fieldErrors: fieldErrors(parsed.error.issues) };
  if (DEMO_MODE) {
    return { ok: true, data: undefined, message: "Demo store — no email is sent. You can sign in with any email and password." };
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });
  // Always succeed so the form can't be used to discover accounts.
  return { ok: true, data: undefined, message: "If an account exists for this email, a reset link is on its way." };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your reset link has expired. Please request a new one." };
  if (DEMO_MODE) return { ok: true, data: { redirectTo: "/account" }, message: DEMO_PASSWORD_NOTE };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: error.code === "same_password" ? "Choose a password you haven't used before." : "We couldn't update your password." };
  }
  return { ok: true, data: { redirectTo: "/account" }, message: "Your password has been updated." };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (DEMO_MODE) return { ok: true, data: undefined, message: DEMO_PASSWORD_NOTE };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: error.code === "same_password" ? "Choose a password you haven't used before." : error.code === "reauthentication_needed" ? "For your security, please sign in again before changing your password." : "We couldn't update your password." };
  }
  return { ok: true, data: undefined, message: "Password updated." };
}

export async function logoutAction(): Promise<void> {
  if (DEMO_MODE) {
    await signOutDemoUser();
    redirect("/");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendVerificationAction(email: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  if (DEMO_MODE) return { ok: true, data: undefined, message: "Demo store — no email is sent." };
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resend({ type: "signup", email: parsed.data.email, options: { emailRedirectTo: `${siteUrl}/auth/confirm?next=/account` } });
  return { ok: true, data: undefined, message: "We've sent a new verification link." };
}
