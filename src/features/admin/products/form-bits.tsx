import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Compact input for table cells and dense rows (the full-size Input is 48px tall). */
export const cellInputClasses = (invalid?: boolean, className?: string) =>
  cn(
    "h-10 w-full rounded-[2px] border bg-white/70 px-3 font-ui text-[14px] text-charcoal placeholder:text-ink-3/80",
    "transition-colors focus:border-charcoal focus:bg-white focus:outline-none",
    invalid ? "border-sale" : "border-line-strong hover:border-ink-3",
    className,
  );

/** Inline error under a compact input; pair with aria-describedby={id}. */
export function CellError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-[12px] leading-snug text-sale">
      {message}
    </p>
  );
}

/** Small uppercase label used above compact controls. */
export function MiniLabel({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block font-ui text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-ink-3", className)}>
      {children}
    </label>
  );
}

/** Parses a typed quantity ("1,200" -> 1200); anything else counts as 0. */
export const units = (value: string | undefined) => {
  const n = Number((value ?? "").replace(/[,\s]/g, ""));
  return Number.isInteger(n) && n > 0 ? n : 0;
};
