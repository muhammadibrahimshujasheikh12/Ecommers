"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/schemas";
import { forgotPasswordAction, loginAction, registerAction, resendVerificationAction, resetPasswordAction } from "./actions";
import { AuthDemoNote } from "./auth-shell";

function applyFieldErrors<T extends FieldValues>(setError: UseFormSetError<T>, fieldErrors?: Record<string, string[] | undefined>) {
  for (const [k, v] of Object.entries(fieldErrors ?? {})) if (v?.[0]) setError(k as Path<T>, { message: v[0] });
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute right-1 top-[30px] grid size-11 place-items-center text-ink-2 hover:text-charcoal"
      >
        {shown ? <EyeOff className="size-4" strokeWidth={1.4} /> : <Eye className="size-4" strokeWidth={1.4} />}
      </button>
    </div>
  );
}

/**
 * `demoEmail` (demo store only) shows how sign-in works there, with a button
 * that fills in a seeded customer who has order history.
 */
export function LoginForm({ next, demoEmail }: { next?: string; demoEmail?: string }) {
  const router = useRouter();
  const [error, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useForm<z.input<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const fillDemoAccount = () => {
    if (!demoEmail) return;
    setValue("email", demoEmail, { shouldValidate: true });
    // Any password works in the demo store; this one just fills the field.
    setValue("password", "demo1234", { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await loginAction(values, next);
    if (!res.ok) {
      applyFieldErrors(setError, res.fieldErrors);
      return setFormError(res.error);
    }
    router.replace(res.data.redirectTo);
    router.refresh();
  });

  return (
    <>
      {demoEmail && (
        <AuthDemoNote
          action={
            <button type="button" onClick={fillDemoAccount} className="link-underline ui-label text-[12px] text-charcoal">
              Use this account
            </button>
          }
        >
          Sign in with any email and password — nothing is checked or stored. Try <strong className="font-medium text-charcoal">{demoEmail}</strong> to see a
          customer with order history.
        </AuthDemoNote>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
        <PasswordInput label="Password" autoComplete="current-password" required error={errors.password?.message} {...register("password")} />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" block size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </>
  );
}

export function RegisterForm({ defaultEmail }: { defaultEmail?: string }) {
  const router = useRouter();
  const [error, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resending, startResend] = useTransition();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<z.input<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: defaultEmail ?? "", marketing: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await registerAction(values);
    if (!res.ok) {
      applyFieldErrors(setError, res.fieldErrors);
      return setFormError(res.error);
    }
    if (res.data.needsVerification) {
      setSentTo(values.email);
      return;
    }
    router.replace(res.data.redirectTo);
    router.refresh();
  });

  if (sentTo) {
    return (
      <div className="text-center" role="status">
        <MailCheck className="mx-auto size-10" strokeWidth={1.1} />
        <h2 className="mt-5 font-display text-[28px]">Check your inbox</h2>
        <p className="mt-3 text-ink-2">
          We’ve sent a verification link to <strong className="text-charcoal">{sentTo}</strong>. Click it to activate your account.
        </p>
        <Button
          variant="secondary"
          className="mt-8"
          loading={resending}
          onClick={() =>
            startResend(async () => {
              const r = await resendVerificationAction(sentTo);
              setResendMsg(r.ok ? (r.message ?? "Sent") : r.error);
            })
          }
        >
          Resend email
        </Button>
        {resendMsg && <p className="mt-3 text-[13px] text-ink-2">{resendMsg}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="First name" autoComplete="given-name" required error={errors.firstName?.message} {...register("firstName")} />
        <Input label="Last name" autoComplete="family-name" required error={errors.lastName?.message} {...register("lastName")} />
      </div>
      <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      <PasswordInput label="Password" autoComplete="new-password" required hint="At least 8 characters with a letter and a number." error={errors.password?.message} {...register("password")} />
      <PasswordInput label="Confirm password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Checkbox label="Email me about new collections, launches and private offers" {...register("marketing")} />
      <p className="text-[13px] text-ink-3">
        By creating an account you agree to our{" "}
        <Link href="/terms-and-conditions" className="underline underline-offset-4">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
      <Button type="submit" block size="lg" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [done, setDone] = useState<string | null>(null);
  const [error, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await forgotPasswordAction(values);
    if (res.ok) setDone(res.message ?? "Check your inbox.");
    else setFormError(res.error);
  });

  if (done) {
    return (
      <div className="text-center" role="status">
        <MailCheck className="mx-auto size-10" strokeWidth={1.1} />
        <p className="mt-5 text-ink-2">{done}</p>
        <Link href="/login" className="link-underline ui-label mt-8 inline-block text-[12px]">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      <Button type="submit" block size="lg" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<z.input<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await resetPasswordAction(values);
    if (!res.ok) {
      applyFieldErrors(setError, res.fieldErrors);
      return setFormError(res.error);
    }
    router.replace(`${res.data.redirectTo}?password=updated`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <PasswordInput label="New password" autoComplete="new-password" required hint="At least 8 characters with a letter and a number." error={errors.password?.message} {...register("password")} />
      <PasswordInput label="Confirm new password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" block size="lg" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
