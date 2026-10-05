import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { DEMO_MODE } from "@/lib/demo/mode";
import { DEMO_ADMIN_EMAIL } from "@/lib/demo/session";
import { getCurrentUser } from "@/lib/supabase/server";
import { enterDemoAdminAction } from "./actions";

/** Shown at /admin/* to anyone who is not an admin. */
export async function AdminGate() {
  const user = await getCurrentUser();
  if (!DEMO_MODE && !user) redirect("/login?next=/admin");

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ivory px-5 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-display text-[30px] font-medium tracking-[0.28em]">AURAQ</p>
        <p className="mt-1 font-ui text-[10px] uppercase tracking-[0.32em] text-ink-3">Admin</p>
        <span className="mx-auto mt-10 grid size-14 place-items-center rounded-full bg-cream">
          <LockKeyhole aria-hidden className="size-6" strokeWidth={1.4} />
        </span>

        {DEMO_MODE ? (
          <>
            <h1 className="mt-6 font-display text-[34px] font-medium leading-tight">Demo store admin</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
              Manage orders, products, customers, reviews, coupons and content. This is the demo store: changes are
              kept in server memory, shared by every visitor and reset when the server restarts.
            </p>
            <form action={enterDemoAdminAction} className="mt-8">
              <Button type="submit" block>
                Enter demo admin
              </Button>
            </form>
            <p className="mt-4 text-[13px] text-ink-3">
              Or sign in as <strong className="font-medium text-ink-2">{DEMO_ADMIN_EMAIL}</strong> with any password.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-[34px] font-medium leading-tight">No admin access</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
              You’re signed in as <strong className="font-medium text-charcoal">{user?.email}</strong>, which isn’t an
              admin account. An existing admin (or the Supabase SQL editor) can grant access:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-[3px] bg-cream p-4 text-left font-mono text-[12px] leading-relaxed">
              {`update public.profiles set role = 'admin'\nwhere id = '${user?.id ?? "<user id>"}';`}
            </pre>
            <form action={logoutAction} className="mt-8">
              <Button type="submit" variant="secondary" block>
                Sign in with another account
              </Button>
            </form>
          </>
        )}
        <Link href="/" className="mt-6 inline-block font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
          Back to the store
        </Link>
      </div>
    </main>
  );
}
