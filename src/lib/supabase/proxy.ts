import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEMO_COOKIES } from "@/lib/demo/constants";
import { DEMO_MODE } from "@/lib/demo/mode";
import type { Database } from "@/types/database";

const PROTECTED_PREFIXES = ["/account"];

/** Sends signed-out visitors on protected routes to /login?next=… */
function guardProtected(request: NextRequest, signedIn: boolean): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  if (signedIn || !PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase session cookie on every matched request and guards
 * account routes. Pages still re-check the user server-side; this is the
 * first line of defence, not the only one.
 */
export async function updateSession(request: NextRequest) {
  if (DEMO_MODE) {
    const signedIn = Boolean(request.cookies.get(DEMO_COOKIES.user)?.value);
    return guardProtected(request, signedIn) ?? NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser(): it refreshes the session.
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  return guardProtected(request, Boolean(userId)) ?? response;
}
