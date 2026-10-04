"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/mode";
import { demoDeleteAddress, demoSaveAddress, demoSetDefaultAddress, demoUpdateProfile } from "@/lib/demo/account";
import { profileSchema, savedAddressSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/types/domain";

const fieldErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string[]> = {};
  for (const i of issues) (out[String(i.path[0] ?? "form")] ??= []).push(i.message);
  return out;
};

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Please sign in again." };
  if (DEMO_MODE) return demoUpdateProfile(parsed.data);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "We couldn't save your profile." };
  revalidatePath("/account", "layout");
  return { ok: true, data: undefined, message: "Profile saved." };
}

export async function saveAddressAction(input: unknown, addressId?: string): Promise<ActionResult<{ id: string }>> {
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  if (addressId && !z.uuid().safeParse(addressId).success) return { ok: false, error: "Invalid address." };
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Please sign in again." };
  if (DEMO_MODE) return demoSaveAddress(parsed.data, addressId);

  const supabase = await createSupabaseServerClient();
  const a = parsed.data;
  const row = {
    user_id: user.id,
    first_name: a.firstName,
    last_name: a.lastName,
    phone: a.phone,
    address_line_1: a.addressLine1,
    address_line_2: a.addressLine2 || null,
    city: a.city,
    province: a.province || null,
    postal_code: a.postalCode || null,
    country: a.country,
  };

  // First address becomes the default automatically.
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
  const makeDefault = a.isDefault || !count;
  if (makeDefault) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);

  const result = addressId
    ? await supabase.from("addresses").update({ ...row, is_default: makeDefault }).eq("id", addressId).select("id").single()
    : await supabase.from("addresses").insert({ ...row, is_default: makeDefault }).select("id").single();
  if (result.error) return { ok: false, error: "We couldn't save this address." };
  revalidatePath("/account/addresses");
  return { ok: true, data: { id: result.data.id }, message: "Address saved." };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(addressId).success) return { ok: false, error: "Invalid address." };
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Please sign in again." };
  if (DEMO_MODE) return demoDeleteAddress(addressId);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("addresses").delete().eq("id", addressId);
  if (error) return { ok: false, error: "We couldn't delete this address." };
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined, message: "Address removed." };
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(addressId).success) return { ok: false, error: "Invalid address." };
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Please sign in again." };
  if (DEMO_MODE) return demoSetDefaultAddress(addressId);
  const supabase = await createSupabaseServerClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
  if (error) return { ok: false, error: "We couldn't update your default address." };
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined, message: "Default address updated." };
}
