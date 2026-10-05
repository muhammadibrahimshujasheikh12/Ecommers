import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mergeGuestCart } from "@/lib/data/cart";
import { DEMO_MODE } from "@/lib/demo/mode";
import { safeNext } from "@/lib/safe-next";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Landing route for Supabase email links (verification, password recovery,
 * email change). Supports both the token-hash template
 * (?token_hash=…&type=…) and the PKCE code flow (?code=…).
 * The demo store sends no emails, so there it simply forwards to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next")) ?? "/account";
  if (DEMO_MODE) return NextResponse.redirect(new URL(next, origin));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createSupabaseServerClient();
  let ok = false;

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) return NextResponse.redirect(new URL("/login?error=link", origin));

  const { data } = await supabase.auth.getUser();
  if (data.user) await mergeGuestCart(data.user.id).catch(() => undefined);

  const destination = type === "recovery" ? "/reset-password" : next;
  return NextResponse.redirect(new URL(destination, origin));
}
