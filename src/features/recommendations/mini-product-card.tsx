import Image from "next/image";
import Link from "next/link";
import { Price, Skeleton } from "@/components/ui/misc";
import type { SearchSuggestions } from "@/lib/data/catalog";

/** The compact product shape returned by /api/search (suggestions and trending). */
export type MiniProduct = SearchSuggestions["products"][number];

/** Lightweight product tile for overlays and drawers (no quick add or swatches). */
export function MiniProductCard({ product, sizes, onNavigate }: { product: MiniProduct; sizes: string; onNavigate?: () => void }) {
  return (
    <Link href={`/product/${product.slug}`} onClick={onNavigate} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-beige">
        {product.image_url && (
          <Image src={product.image_url} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 ease-[var(--ease-standard)] group-hover:scale-[1.03]" />
        )}
      </div>
      <p className="mt-3 font-ui text-[14px] font-medium leading-snug md:text-[15px]">{product.name}</p>
      {product.category_name && <p className="font-ui text-[12px] text-ink-3 md:text-[13px]">{product.category_name}</p>}
      <Price price={Number(product.price)} compareAt={product.compare_at_price === null ? null : Number(product.compare_at_price)} size="sm" compact className="mt-1" />
    </Link>
  );
}

export function MiniProductSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-[3/4]" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  );
}
