import Link from "next/link";
import { cn } from "@/utils/cn";

/**
 * What shoppers look for most, each pointing at the page that answers it best
 * (a collection or category where one exists, otherwise a search).
 */
export const POPULAR_SEARCHES = [
  { label: "Lawn", href: "/collections/seasonal" },
  { label: "Organza", href: "/shop?q=organza" },
  { label: "Festive", href: "/collections/festive" },
  { label: "Unstitched", href: "/category/unstitched" },
  { label: "Co-ords", href: "/category/co-ords" },
  { label: "Luxury Pret", href: "/category/luxury-pret" },
  { label: "Chiffon", href: "/shop?q=chiffon" },
] as const;

/** Pill links to the most popular searches; works in Server and Client Components. */
export function PopularSearchLinks({ label = "Popular searches", onNavigate, align = "start", className }: { label?: string; onNavigate?: () => void; align?: "start" | "center"; className?: string }) {
  return (
    <nav aria-label="Popular searches" className={className}>
      <p className={cn("eyebrow mb-4", align === "center" && "text-center")}>{label}</p>
      <ul className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>
        {POPULAR_SEARCHES.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              onClick={onNavigate}
              className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 font-ui text-[13px] tracking-[0.04em] transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
