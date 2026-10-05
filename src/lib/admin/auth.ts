import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "@/lib/demo/mode";
import { getDemoUser } from "@/lib/demo/session";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

/*
 * Admin access is decided on the server for every request. The admin layout
 * shows a gate to everyone else, but layouts are not re-run on every
 * navigation, so each admin page must also call requireAdminPage() and each
 * admin Server Action must start with requireAdminAction(). With Supabase,
 * row-level security (public.is_admin()) enforces the same rule again in the
 * database.
 */

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  /** True in demo mode: data is sample data held in server memory. */
  demo: boolean;
};

/** The signed-in admin for this request, or null. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  if (DEMO_MODE) {
    const user = await getDemoUser();
    if (!user || user.role !== "admin") return null;
    return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim(), demo: true };
  }
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const [{ data: isAdmin, error }, { data: profile }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle(),
  ]);
  if (error || !isAdmin) return null;
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Admin";
  return { id: user.id, email: user.email ?? "", name, demo: false };
});

/** For admin pages: renders the 404 page for anyone who is not an admin. */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}

/** For admin Server Actions: returns the admin, or an ActionResult error to return as-is. */
export async function requireAdminAction(): Promise<{ admin: AdminUser; denied: null } | { admin: null; denied: ActionResult<never> }> {
  const admin = await getAdminUser();
  if (!admin) return { admin: null, denied: { ok: false, error: "Your admin session has ended. Please sign in again." } };
  return { admin, denied: null };
}
