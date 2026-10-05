"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/*
 * Range switching keeps the current dashboard on screen (dimmed, aria-busy)
 * while the next one loads, instead of flashing a skeleton.
 */

type Frame = { pending: boolean; go: (href: string) => void };
const FrameContext = createContext<Frame | null>(null);

export function DashboardFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  return <FrameContext.Provider value={{ pending, go }}>{children}</FrameContext.Provider>;
}

/** The part of the dashboard that the range scopes. */
export function DashboardBody({ children }: { children: ReactNode }) {
  const frame = useContext(FrameContext);
  return (
    <div aria-busy={frame?.pending || undefined} className={cn("transition-opacity duration-200", frame?.pending && "opacity-55")}>
      {children}
    </div>
  );
}

/** Same-page links (range, top-products toggle) that load inside the frame. */
export function FrameLink({ href, className, children, current }: { href: string; className?: string; children: ReactNode; current?: boolean }) {
  const frame = useContext(FrameContext);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!frame || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    frame.go(href);
  };
  return (
    <Link href={href} scroll={false} onClick={onClick} aria-current={current ? "true" : undefined} className={className}>
      {children}
    </Link>
  );
}

export function RangePicker({ options, active }: { options: { days: number; label: string; href: string }[]; active: number }) {
  return (
    <nav aria-label="Date range">
      <ul className="inline-flex rounded-[3px] border border-line bg-white/70 p-1">
        {options.map((o) => (
          <li key={o.days}>
            <FrameLink
              href={o.href}
              current={o.days === active}
              className={cn(
                "inline-flex h-9 items-center rounded-[2px] px-3.5 font-ui text-[13px] transition-colors",
                o.days === active ? "bg-charcoal text-ivory" : "text-ink-2 hover:bg-cream hover:text-charcoal",
              )}
            >
              {o.label}
            </FrameLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
