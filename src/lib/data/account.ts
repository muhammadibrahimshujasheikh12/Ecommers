import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Address } from "@/types/domain";

export type Profile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string;
};

export async function getProfile(userId: string, email: string): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone")
    .eq("id", userId)
    .maybeSingle();
  return {
    id: userId,
    firstName: data?.first_name ?? null,
    lastName: data?.last_name ?? null,
    phone: data?.phone ?? null,
    email,
  };
}

type AddressRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  province: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
};

export const toAddress = (a: AddressRow): Address => ({
  id: a.id,
  firstName: a.first_name,
  lastName: a.last_name,
  phone: a.phone,
  addressLine1: a.address_line_1,
  addressLine2: a.address_line_2,
  city: a.city,
  province: a.province,
  postalCode: a.postal_code,
  country: a.country,
  isDefault: a.is_default,
});

/** Saved addresses of the signed-in user (RLS-scoped). */
export async function getMyAddresses(): Promise<Address[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, first_name, last_name, phone, address_line_1, address_line_2, city, province, postal_code, country, is_default")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load addresses: ${error.message}`);
  return data.map(toAddress);
}

export async function getAccountStats(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [orders, wishlist, addresses] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("wishlists").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return {
    orders: orders.count ?? 0,
    wishlist: wishlist.count ?? 0,
    addresses: addresses.count ?? 0,
  };
}
