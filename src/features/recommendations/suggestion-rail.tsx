import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading, Skeleton } from "@/components/ui/misc";
import type { ProductSummary } from "@/types/domain";
import { cn } from "@/utils/cn";

export type SuggestionRailProps = {
  id: string;
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
  /** Smaller heading for secondary columns such as the account area. */
  compact?: boolean;
  /** Hairline above the rail, separating it from the empty state it follows. */
  divider?: boolean;
};

// Like the home page's category row: a swipeable, edge-to-edge row on phones
// (bottom padding keeps swatch outlines and focus rings clear of the scroll
// clip), four across from 768px — full width, beside the account nav or under
// the filter sidebar alike.
const TRACK =
  "scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:gap-6";
const SLOT = "w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto";
const CARD_SIZES = "(min-width: 1440px) 300px, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 44vw";

function sectionClass(divider: boolean) {
  return divider ? "border-t border-line pt-12 md:pt-16" : undefined;
}

function RailHeading({ id, eyebrow, title, href, linkLabel = "View all", compact }: Omit<SuggestionRailProps, "divider">) {
  const action = href ? (
    <Link href={href} className="link-underline ui-label inline-flex shrink-0 items-center gap-2 text-[12px]">
      {linkLabel} <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden />
    </Link>
  ) : undefined;

  if (!compact) return <SectionHeading id={id} eyebrow={eyebrow} title={title} action={action} />;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-8">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 id={id} className="font-display text-[28px] leading-tight">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/** A short, curated row of product cards shown beneath empty states. */
export function SuggestionRail({ products, divider = true, ...heading }: SuggestionRailProps & { products: ProductSummary[] }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={heading.id} className={sectionClass(divider)}>
      <RailHeading {...heading} />
      <ul className={TRACK}>
        {products.map((p) => (
          <li key={p.id} className={SLOT}>
            <ProductCard product={p} sizes={CARD_SIZES} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Placeholder with the rail's exact footprint while suggestions stream in. */
export function SuggestionRailSkeleton({ compact, divider = true }: { compact?: boolean; divider?: boolean }) {
  return (
    <div className={sectionClass(divider)} aria-hidden>
      <div className={compact ? "mb-6 md:mb-8" : "mb-8 md:mb-12"}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className={cn("mt-3 w-56", compact ? "h-7" : "h-9 md:h-11")} />
      </div>
      <div className={TRACK}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={SLOT}>
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
