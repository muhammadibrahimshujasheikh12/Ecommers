import type { Metadata } from "next";
import { ChangePasswordForm, ProfileForm } from "@/features/account/profile-forms";
import { getProfile } from "@/lib/data/account";
import { getCurrentUser } from "@/lib/supabase/server";
import { logoutAction } from "@/features/auth/actions";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = { title: "Profile & Security", robots: { index: false } };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getProfile(user.id, user.email ?? "");

  return (
    <div className="space-y-14">
      <section aria-labelledby="profile-heading" className="max-w-xl">
        <h1 id="profile-heading" className="font-display text-[32px]">
          Profile
        </h1>
        <p className="mb-8 mt-2 text-ink-2">Keep your details up to date for smooth deliveries.</p>
        <ProfileForm email={user.email ?? ""} initial={{ firstName: profile.firstName ?? "", lastName: profile.lastName ?? "", phone: profile.phone ?? "" }} />
      </section>

      <section aria-labelledby="security-heading" className="max-w-xl border-t border-line pt-12">
        <h2 id="security-heading" className="font-display text-[28px]">
          Password &amp; security
        </h2>
        <p className="mb-8 mt-2 text-ink-2">
          Choose a strong password you don’t use elsewhere.
          {user.last_sign_in_at && <> Last signed in {formatDate(user.last_sign_in_at, true)}.</>}
        </p>
        <ChangePasswordForm />
        <form action={logoutAction} className="mt-10 border-t border-line pt-8">
          <button type="submit" className="font-ui text-[13px] uppercase tracking-[0.14em] text-ink-2 underline underline-offset-4 hover:text-charcoal">
            Sign out of this device
          </button>
        </form>
      </section>
    </div>
  );
}
