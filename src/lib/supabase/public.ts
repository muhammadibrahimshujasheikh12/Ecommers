import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export const CATALOG_TAG = "catalog";
export const CONTENT_TAG = "content";

/**
 * Anonymous, cookie-free client for public catalogue reads. Requests go
 * through Next's data cache (revalidated every few minutes or on demand via
 * revalidateTag(CATALOG_TAG)), so product pages stay fast under load.
 */
export function createSupabasePublicClient(options: { revalidate?: number; tags?: string[] } = {}) {
  const { revalidate = 300, tags = [CATALOG_TAG] } = options;
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate, tags } }),
    },
  });
}
