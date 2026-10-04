import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthDemoNote, AuthShell } from "@/features/auth/auth-shell";
import { RegisterForm } from "@/features/auth/auth-forms";
import { getCurrentUser } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/mode";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Create an account", path: "/register", noIndex: true });

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const email = typeof params.email === "string" ? params.email.slice(0, 254) : undefined;

  return (
    <AuthShell
      eyebrow="Join AURAQ"
      title="Create an account"
      intro="Track orders, save addresses and keep your wishlist across devices."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-charcoal underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      {DEMO_MODE && (
        <AuthDemoNote>Your account is created instantly in this browser. No email is sent and passwords aren’t stored.</AuthDemoNote>
      )}
      <RegisterForm defaultEmail={email} />
    </AuthShell>
  );
}
