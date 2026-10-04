import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/mode";
import { getDemoAuthUser } from "@/lib/demo/session";
import type { Database } from "@/types/database";

/**
 * Supabase client bound to the visitor's session cookies. Respects RLS as the
 * signed-in user (or anon). Use in Server Components, Server Actions and
 * Route Handlers.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = supabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes the session cookie on every request instead.
        }
      },
    },
  });
}

/**
 * The authenticated user for this request, verified with Supabase Auth.
 * Memoised per request so layouts and pages can both call it cheaply.
 */
export const getCurrentUser = cache(async () => {
  if (DEMO_MODE) return getDemoAuthUser();
  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
});
