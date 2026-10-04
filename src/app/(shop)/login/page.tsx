import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/auth-forms";
import { Alert } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/mode";
import { DEMO_SAMPLE_EMAIL } from "@/lib/demo/account";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Sign in", path: "/login", noIndex: true });

const safe = (next: unknown) =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : undefined;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safe(params.next);
  if (await getCurrentUser()) redirect(next ?? "/account");

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      intro="Access your orders, saved addresses and wishlist."
      footer={
        <>
          New to AURAQ?{" "}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-charcoal underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      {params.verified === "1" && <Alert tone="success" className="mb-6">Your email is verified. Please sign in.</Alert>}
      {params.error === "link" && (
        <Alert tone="error" className="mb-6">
          That link is invalid or has expired. Please sign in or request a new link.
        </Alert>
      )}
      <LoginForm next={next} demoEmail={DEMO_MODE ? DEMO_SAMPLE_EMAIL : undefined} />
    </AuthShell>
  );
}
