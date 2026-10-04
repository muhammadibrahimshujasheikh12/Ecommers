import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 * Only for trusted server code that enforces ownership itself (guest carts,
 * order placement, newsletter). Never import from client components — the
 * "server-only" import above makes that a build error.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
