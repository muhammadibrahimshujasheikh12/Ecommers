import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 * Only for trusted server code that enforces ownership itself (guest carts,
 * order placement, newsletter). Never import from client components — the
 * "server-only" import above makes that a build error.
 */
export function createSupabaseAdminClient() {
  const { url } = supabaseConfig();
  const serviceRoleKey = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required when Supabase is configured.");
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
