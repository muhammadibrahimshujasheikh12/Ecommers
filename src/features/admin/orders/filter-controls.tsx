import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { cn } from "@/utils/cn";

/*
 * Compact labelled controls for admin filter bars (GET forms, so they work
 * without JavaScript and every filtered view has its own URL).
 */

const control = (extra?: string) => cn(inputClasses(false), "h-11 px-3 text-[14px]", extra);

export function FilterField({ id, label, children, className }: { id: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-ui text-[12px] font-medium tracking-[0.04em] text-ink-2">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterInput({ id, label, className, ...rest }: ComponentProps<"input"> & { id: string; label: string }) {
  return (
    <FilterField id={id} label={label} className={className}>
      <input id={id} className={control()} {...rest} />
    </FilterField>
  );
}

export function FilterSelect({
  id,
  label,
  className,
  children,
  ...rest
}: ComponentProps<"select"> & { id: string; label: string }) {
  return (
    <FilterField id={id} label={label} className={className}>
      <div className="relative">
        <select id={id} className={control("appearance-none pr-9")} {...rest}>
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </FilterField>
  );
}

export function FilterActions({ clearHref, showClear }: { clearHref: string; showClear: boolean }) {
  return (
    <div className="flex w-full items-center gap-4 sm:w-auto">
      <button type="submit" className={buttonClasses({ size: "sm", className: "h-11 flex-1 sm:flex-none" })}>
        Apply
      </button>
      {showClear && (
        <Link href={clearHref} className="font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
          Clear filters
        </Link>
      )}
    </div>
  );
}

/** "Showing 21–40 of 57 orders", announced when the results change. */
export function ResultsSummary({ page, pageSize, total, noun }: { page: number; pageSize: number; total: number; noun: [string, string] }) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const word = total === 1 ? noun[0] : noun[1];
  return (
    <p role="status" className="mb-3 font-ui text-[13px] text-ink-3">
      {total === 0
        ? `No ${noun[1]} found`
        : start > total
          ? `No ${noun[1]} on page ${page} — ${total.toLocaleString("en-US")} ${word} in total`
          : `Showing ${start.toLocaleString("en-US")}–${end.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} ${word}`}
    </p>
  );
}
