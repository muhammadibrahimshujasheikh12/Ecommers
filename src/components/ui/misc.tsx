import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { discountPercent, formatPrice } from "@/utils/format";

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
const badgeStyles = {
  new: "bg-ivory text-charcoal",
  sale: "bg-sale text-ivory",
  soldout: "bg-charcoal text-ivory",
  neutral: "bg-cream text-charcoal",
  success: "bg-sage text-charcoal",
  warning: "bg-blush text-charcoal",
} as const;

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof badgeStyles; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-[2px] px-2.5 py-1.5 font-ui text-[11px] font-medium uppercase leading-none tracking-[0.14em]", badgeStyles[tone], className)}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------
export function Stars({ value, size = 14, className, label }: { value: number; size?: number; className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-charcoal", className)} role="img" aria-label={label ?? `${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`star-${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z"
              fill={`url(#star-${i}-${Math.round(fill * 100)})`}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------
export function Price({ price, compareAt, size = "md", compact, className }: { price: number; compareAt?: number | null; size?: "sm" | "md" | "lg"; compact?: boolean; className?: string }) {
  const off = discountPercent(price, compareAt);
  const text = size === "lg" ? "text-[22px]" : size === "sm" ? "text-[14px]" : "text-[15px]";
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-ui tracking-[0.04em]", text, className)}>
      <span className={cn(off ? "font-medium text-sale" : "text-charcoal")}>
        {off ? <span className="sr-only">Sale price </span> : null}
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <s className="text-[0.86em] text-ink-3">
            <span className="sr-only">Original price </span>
            {formatPrice(compareAt!)}
          </s>
          <span className={cn("text-[12px] tracking-[0.06em] text-sale", compact && "hidden md:inline")}>−{off}%</span>
        </>
      )}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------
export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("font-ui text-[12px] tracking-[0.08em] text-ink-2", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="transition-colors hover:text-charcoal">
                {item.name}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-charcoal">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------
export function SectionHeading({
  eyebrow,
  title,
  action,
  align = "left",
  as: Tag = "h2",
  id,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  id?: string;
}) {
  return (
    <div className={cn("mb-8 flex gap-x-6 gap-y-3 md:mb-12", align === "center" ? "flex-col items-center text-center" : "flex-wrap items-end justify-between")}>
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <Tag id={id} className="heading-section">
          {title}
        </Tag>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state, skeleton, alert
// ---------------------------------------------------------------------------
export function EmptyState({ icon, title, children, action, as: Heading = "h2" }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; as?: "h1" | "h2" }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center md:py-24">
      {icon && <div className="mb-6 grid size-16 place-items-center rounded-full bg-cream text-charcoal">{icon}</div>}
      <Heading className="font-display text-[28px] leading-tight md:text-[32px]">{title}</Heading>
      {children && <div className="mt-3 text-ink-2">{children}</div>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse bg-beige/70", className)} />;
}

export function Alert({ tone = "info", children, className }: { tone?: "info" | "error" | "success" | "warning"; children: ReactNode; className?: string }) {
  const styles = {
    info: "bg-cream text-charcoal",
    error: "bg-blush text-sale",
    success: "bg-sage text-charcoal",
    warning: "bg-blush text-charcoal",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[2px] px-4 py-3 text-[14px] leading-relaxed", styles, className)}>
      {children}
    </div>
  );
}
