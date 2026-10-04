import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client bound to the visitor's session cookies. Respects RLS as the
 * signed-in user (or anon). Use in Server Components, Server Actions and
 * Route Handlers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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
  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
});
