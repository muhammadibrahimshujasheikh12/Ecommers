import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

/*
 * Building blocks shared by every admin screen, so the panel reads as one
 * system: page header, panels, stat cards, tables, badges and filter bars.
 */

export type AdminCrumb = { name: string; href?: string };

export function AdminPageHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: AdminCrumb[];
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1.5 font-ui text-[12px] text-ink-3">
              {crumbs.map((c, i) => (
                <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight aria-hidden className="size-3" />}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-charcoal">
                      {c.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-ink-2">
                      {c.name}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="font-display text-[34px] font-medium leading-tight md:text-[40px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-[3px] border border-line bg-white/70", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em]">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-ink-3">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-5 md:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-[3px] border border-line bg-white/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-ui text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">{label}</p>
        {icon && <span className="text-ink-3 [&>svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-3 font-display text-[32px] font-medium leading-none">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-cream text-charcoal",
  success: "bg-sage/60 text-charcoal",
  warning: "bg-[#f3e2b8] text-charcoal",
  danger: "bg-[#efcdc7] text-sale",
  info: "bg-powder/60 text-charcoal",
  muted: "bg-line text-ink-2",
} as const;

export type AdminBadgeTone = keyof typeof badgeTones;

export function AdminBadge({ tone = "neutral", children, className }: { tone?: AdminBadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 font-ui text-[11px] font-medium uppercase tracking-[0.1em]", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

/** Horizontally scrollable table wrapper; tables keep their own min-width. */
export function Table({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto md:-mx-6" role={label ? "region" : undefined} aria-label={label} tabIndex={label ? 0 : undefined}>
      <table className={cn("w-full min-w-[640px] border-collapse text-left text-[13.5px]", className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className, align = "left" }: { children?: ReactNode; className?: string; align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-5 py-3 font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3 first:pl-5 md:first:pl-6 last:pr-5 md:last:pr-6",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, align = "left" }: { children?: ReactNode; className?: string; align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cn(
        "border-b border-line px-5 py-3.5 align-middle first:pl-5 md:first:pl-6 last:pr-5 md:last:pr-6",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center text-[14px] text-ink-3">
        {children}
      </td>
    </tr>
  );
}

/** GET form for search + filters; submitting resets pagination. */
export function FilterBar({ children, action }: { children: ReactNode; action: string }) {
  return (
    <form action={action} method="get" role="search" className="mb-5 flex flex-wrap items-end gap-3">
      {children}
    </form>
  );
}

/** Builds an admin URL with query params, dropping empty values. */
export function adminHref(path: string, params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Compact date + time for tables. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
