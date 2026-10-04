import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/auth-forms";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Choose a new password", path: "/reset-password", noIndex: true });

export default async function ResetPasswordPage() {
  // The recovery link (via /auth/confirm) signs the user in before landing here.
  const user = await getCurrentUser();
  return (
    <AuthShell eyebrow="Account help" title="Choose a new password" intro={user ? `For ${user.email}` : undefined}>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div>
          <p className="text-ink-2">This password reset link is invalid or has expired. Reset links can only be used once and expire after an hour.</p>
          <ButtonLink href="/forgot-password" className="mt-8">
            Request a new link
          </ButtonLink>
        </div>
      )}
    </AuthShell>
  );
}
