import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

/** Link-based pagination (crawlable, works without JS). */
export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);

  const item = "grid h-11 min-w-11 place-items-center px-3 font-ui text-[14px] tracking-[0.06em] transition-colors";
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(item, "hover:bg-cream")} aria-label="Previous page" rel="prev">
          <ChevronLeft className="size-4" strokeWidth={1.5} />
        </Link>
      ) : (
        <span className={cn(item, "text-ink-3/50")} aria-hidden>
          <ChevronLeft className="size-4" strokeWidth={1.5} />
        </span>
      )}
      {sorted.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - sorted[i - 1] > 1 && <span className="px-2 text-ink-3">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-charcoal text-ivory" : "hover:bg-cream")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(item, "hover:bg-cream")} aria-label="Next page" rel="next">
          <ChevronRight className="size-4" strokeWidth={1.5} />
        </Link>
      ) : (
        <span className={cn(item, "text-ink-3/50")} aria-hidden>
          <ChevronRight className="size-4" strokeWidth={1.5} />
        </span>
      )}
    </nav>
  );
}
