import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/auth-forms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Forgot password", path: "/forgot-password", noIndex: true });

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account help"
      title="Reset your password"
      intro="Enter the email you used to create your account and we’ll send you a secure link to choose a new password."
      footer={
        <Link href="/login" className="text-charcoal underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
