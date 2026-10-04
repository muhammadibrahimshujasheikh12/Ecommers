import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "light" | "outline-light" | "ghost" | "text";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-ui font-medium uppercase tracking-[0.18em] transition-[background-color,color,border-color,opacity] duration-300 ease-[var(--ease-standard)] disabled:cursor-not-allowed disabled:opacity-100 aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-charcoal text-ivory hover:bg-charcoal-soft disabled:bg-line disabled:text-ink-3 aria-disabled:bg-line aria-disabled:text-ink-3",
  secondary:
    "border border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory disabled:border-line-strong disabled:text-ink-3 disabled:hover:bg-transparent",
  light: "bg-ivory text-charcoal hover:bg-transparent hover:text-ivory border border-ivory",
  "outline-light": "border border-ivory text-ivory hover:bg-ivory hover:text-charcoal",
  ghost: "text-charcoal hover:bg-cream",
  text: "link-underline !px-0 !h-auto text-charcoal tracking-[0.18em]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-[12px]",
  md: "h-12 px-8 text-[13px]",
  lg: "h-14 px-10 text-[13px]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  block,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], variant !== "text" && sizes[size], block && "w-full", className);
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent"
    />
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant, size, block, loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
};

export function ButtonLink({ variant, size, block, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...rest}>
      {children}
      {icon}
    </Link>
  );
}
