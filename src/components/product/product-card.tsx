import Image from "next/image";
import Link from "next/link";
import { Badge, Price } from "@/components/ui/misc";
import { WishlistButton } from "./wishlist-button";
import { QuickAdd } from "./quick-add";
import type { ProductSummary } from "@/types/domain";
import { cn } from "@/utils/cn";

const DEFAULT_SIZES = "(min-width: 1440px) 320px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw";

/**
 * Reusable product card: 3:4 image with hover swap, badge, wishlist, quick
 * add, name, category, PKR price (with sale price) and colour swatches.
 */
export function ProductCard({
  product,
  priority,
  showRating = false,
  sizes = DEFAULT_SIZES,
}: {
  product: ProductSummary;
  priority?: boolean;
  showRating?: boolean;
  sizes?: string;
}) {
  const [primary, secondary] = product.images;
  const href = `/product/${product.slug}`;
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);

  return (
    <article className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-beige">
        <Link href={href} className="absolute inset-0" aria-label={product.name} tabIndex={-1}>
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes={sizes}
              priority={priority}
              className={cn("object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-standard)]", !product.inStock && "opacity-75 saturate-[0.55]", secondary && "md:group-hover:opacity-0")}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes={sizes}
              className={cn("hidden object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-standard)] md:block md:group-hover:opacity-100", !product.inStock && "saturate-[0.55]")}
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5 md:left-3.5 md:top-3.5">
          {!product.inStock ? <Badge tone="soldout">Sold Out</Badge> : onSale ? <Badge tone="sale">Sale</Badge> : product.isNew ? <Badge tone="new">New</Badge> : null}
        </div>

        <WishlistButton productId={product.id} name={product.name} className="absolute right-1.5 top-1.5 z-10 md:right-2 md:top-2" />
        {product.inStock && <QuickAdd product={product} />}
      </div>

      <div className="pt-3.5 md:pt-4">
        <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:justify-between md:gap-3">
          <h3 className="font-ui text-[14px] font-medium leading-snug tracking-[0.02em] md:text-[15px]">
            <Link href={href} className="hover:underline hover:decoration-1 hover:underline-offset-4">
              {product.name}
            </Link>
          </h3>
          {showRating && product.ratingCount > 0 && (
            <p className="flex shrink-0 items-center gap-1 font-ui text-[13px]" aria-label={`Rated ${product.rating.toFixed(1)} out of 5 from ${product.ratingCount} reviews`}>
              <svg aria-hidden viewBox="0 0 24 24" className="size-3"><path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z" fill="currentColor" /></svg>
              {product.rating.toFixed(1)} <span className="text-ink-3">({product.ratingCount})</span>
            </p>
          )}
        </div>
        {product.category && <p className="font-ui text-[12px] leading-relaxed tracking-[0.02em] text-ink-3 md:text-[13px]">{product.category.name}</p>}
        <Price price={product.price} compareAt={product.compareAtPrice} size="sm" compact className="mt-1.5" />
        {product.colors.length > 1 && (
          <ul className="mt-2.5 flex gap-2" aria-label={`Available in ${product.colors.map((c) => c.name).join(", ")}`}>
            {product.colors.map((c, i) => (
              <li key={c.name}>
                <span
                  title={c.name}
                  className={cn("block size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(42_40_38/0.12)]", i === 0 && "outline outline-1 outline-offset-2 outline-charcoal")}
                  style={{ backgroundColor: c.hex ?? "#ccc" }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, showRating, columns = 4 }: { products: ProductSummary[]; priorityCount?: number; showRating?: boolean; columns?: 3 | 4 }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-9 md:gap-x-5 md:gap-y-12 lg:gap-x-6 lg:gap-y-14", columns === 4 ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3")}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} showRating={showRating} />
        </li>
      ))}
    </ul>
  );
}
