"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { changePasswordSchema, profileSchema } from "@/lib/validation/schemas";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { updateProfileAction } from "./actions";
import { changePasswordAction } from "@/features/auth/actions";

export function ProfileForm({ initial, email }: { initial: { firstName: string; lastName: string; phone: string }; email: string }) {
  const router = useRouter();
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<z.input<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    const res = await updateProfileAction(values);
    setResult(res.ok ? { tone: "success", message: res.message ?? "Saved" } : { tone: "error", message: res.error });
    if (res.ok) {
      reset(values);
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {result && <Alert tone={result.tone}>{result.message}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="First name" autoComplete="given-name" required error={errors.firstName?.message} {...register("firstName")} />
        <Input label="Last name" autoComplete="family-name" required error={errors.lastName?.message} {...register("lastName")} />
      </div>
      <Input label="Email" value={email} readOnly disabled hint="Contact customer care to change the email on your account." />
      <Input label="Phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        Save changes
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof changePasswordSchema>>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const res = await changePasswordAction(values);
    setResult(res.ok ? { tone: "success", message: res.message ?? "Password updated" } : { tone: "error", message: res.error });
    if (res.ok) reset({ password: "", confirmPassword: "" });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {result && <Alert tone={result.tone}>{result.message}</Alert>}
      <Input label="New password" type="password" autoComplete="new-password" required hint="At least 8 characters with a letter and a number." error={errors.password?.message} {...register("password")} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" variant="secondary" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
