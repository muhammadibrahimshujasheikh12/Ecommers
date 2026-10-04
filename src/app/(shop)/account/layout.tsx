import { redirect } from "next/navigation";
import { AccountNav } from "@/features/account/account-nav";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/account";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  // The proxy already redirects signed-out visitors; this is the authoritative check.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const profile = await getProfile(user.id, user.email ?? "");

  return (
    <div className="container-site pb-24 pt-10 md:pt-14">
      <div className="mb-10 md:mb-14">
        <p className="eyebrow">My account</p>
        <p className="heading-page mt-3">Hello{profile.firstName ? `, ${profile.firstName}` : ""}</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside>
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
