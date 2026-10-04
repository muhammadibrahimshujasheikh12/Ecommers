"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { z } from "zod";
import { newsletterSchema } from "@/lib/validation/schemas";
import { subscribeAction } from "./actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type Values = z.input<typeof newsletterSchema>;

export function NewsletterForm({ variant = "hero", source = "website" }: { variant?: "hero" | "footer"; source?: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(newsletterSchema), defaultValues: { email: "", source, company: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    const res = await subscribeAction(values);
    setResult(res.ok ? { ok: true, message: res.message ?? "Thank you for subscribing." } : { ok: false, message: res.error });
    if (res.ok) reset({ email: "", source, company: "" });
  });

  const id = `newsletter-${variant}`;
  const error = errors.email?.message ?? (result && !result.ok ? result.message : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className={cn(variant === "hero" ? "mx-auto max-w-xl" : "")}>
      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-company`}>Company</label>
        <input id={`${id}-company`} tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>
      <input type="hidden" {...register("source")} />

      <div className={cn("flex gap-3", variant === "hero" ? "flex-col sm:flex-row sm:items-end" : "items-end")}>
        <div className="relative flex-1">
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-msg`}
            className={cn(
              "peer h-14 w-full border-0 border-b bg-transparent px-0 pb-1.5 pt-5 font-ui text-[16px] tracking-[0.02em] focus:outline-none focus-visible:outline-none",
              error ? "border-sale" : "border-charcoal/35 focus:border-charcoal focus:shadow-[0_1px_0_var(--color-charcoal)]",
            )}
            {...register("email")}
          />
          <label
            htmlFor={`${id}-email`}
            className="pointer-events-none absolute left-0 top-[18px] font-ui text-[15px] text-ink-2 transition-all duration-200 peer-focus:top-1 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.16em]"
          >
            Email Address
          </label>
        </div>
        {variant === "hero" ? (
          <Button type="submit" loading={isSubmitting} className="sm:w-auto">
            Subscribe
          </Button>
        ) : (
          <button type="submit" disabled={isSubmitting} aria-label="Subscribe" className="grid h-14 w-11 place-items-center border-b border-charcoal/35">
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <p id={`${id}-msg`} role={error ? "alert" : "status"} className={cn("mt-3 min-h-5 text-[13px]", error ? "text-sale" : "text-success")}>
        {error ??
          (result?.ok && (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5" strokeWidth={2} /> {result.message}
            </span>
          ))}
      </p>
    </form>
  );
}
