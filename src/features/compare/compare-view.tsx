"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { GitCompareArrows, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Price, Skeleton, Stars } from "@/components/ui/misc";
import { WishlistButton } from "@/components/product/wishlist-button";
import { useCart } from "@/features/cart/cart-provider";
import { getCompareProductsAction } from "@/features/wishlist/actions";
import { COMPARE_LIMIT, compareStore } from "@/stores/local";
import type { ProductDetail } from "@/types/domain";

function AddToBag({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const [pending, start] = useTransition();
  const options = product.variants.filter((v) => v.color === (product.colors[0]?.name ?? v.color));
  const [variantId, setVariantId] = useState(options.length === 1 ? options[0].id : "");
  if (!product.inStock) return <p className="font-ui text-[13px] text-sale">Sold out</p>;
  return (
    <div className="flex flex-col gap-2">
      {options.length > 1 && (
        <select
          aria-label={`Size for ${product.name}`}
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          className="h-10 border border-line-strong bg-transparent px-2 font-ui text-[13px] focus:border-charcoal focus:outline-none"
        >
          <option value="">Select size</option>
          {options.map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock <= 0}>
              {v.size}
              {v.stock <= 0 ? " — sold out" : ""}
            </option>
          ))}
        </select>
      )}
      <Button size="sm" onClick={() => start(async () => void (await addItem({ productId: product.id, variantId: variantId || null, quantity: 1 })))} loading={pending} disabled={options.length > 1 && !variantId}>
        Add to bag
      </Button>
    </div>
  );
}

const ROWS: { label: string; render: (p: ProductDetail) => React.ReactNode }[] = [
  { label: "Price", render: (p) => <Price price={p.price} compareAt={p.compareAtPrice} size="sm" /> },
  {
    label: "Rating",
    render: (p) =>
      p.ratingCount ? (
        <span className="inline-flex items-center gap-2">
          <Stars value={p.rating} size={12} /> <span className="text-ink-3">({p.ratingCount})</span>
        </span>
      ) : (
        <span className="text-ink-3">No reviews yet</span>
      ),
  },
  { label: "Availability", render: (p) => (p.inStock ? <span className="text-success">In stock</span> : <span className="text-sale">Sold out</span>) },
  { label: "Category", render: (p) => p.category?.name ?? "—" },
  { label: "Material", render: (p) => p.material ?? "—" },
  { label: "Sizes", render: (p) => p.sizes.join(", ") || "—" },
  {
    label: "Colours",
    render: (p) => (
      <span className="flex flex-wrap gap-2">
        {p.colors.map((c) => (
          <span key={c.name} className="inline-flex items-center gap-1.5">
            <span className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(42_40_38/0.15)]" style={{ backgroundColor: c.hex ?? "#ddd" }} />
            {c.name}
          </span>
        ))}
      </span>
    ),
  },
  { label: "Description", render: (p) => <span className="text-ink-2">{p.shortDescription}</span> },
  {
    label: "Specifications",
    render: (p) => (
      <dl className="space-y-1.5">
        {p.details.map((d) => (
          <div key={d.label}>
            <dt className="text-[12px] uppercase tracking-[0.1em] text-ink-3">{d.label}</dt>
            <dd>{d.value}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  { label: "Care", render: (p) => <span className="text-ink-2">{p.careInstructions}</span> },
];

export function CompareView() {
  const ids = compareStore.useStore();
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getCompareProductsAction(key.split(",")).then((p) => !cancelled && setProducts(p));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const remove = (id: string) => compareStore.set(compareStore.get().filter((x) => x !== id));
  const visible = !key ? [] : (products?.filter((p) => ids.includes(p.id)) ?? null);

  if (visible === null) {
    return (
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4" role="status" aria-busy aria-label="Loading comparison">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    );
  }
  if (!visible.length) {
    return (
      <EmptyState icon={<GitCompareArrows className="size-6" strokeWidth={1.2} />} title="Nothing to compare yet" action={<ButtonLink href="/shop">Browse products</ButtonLink>}>
        Use “Add to compare” on a product page to compare up to {COMPARE_LIMIT} pieces side by side.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between font-ui text-[13px] text-ink-2">
        <p>
          Comparing {visible.length} of {COMPARE_LIMIT}
        </p>
        <button type="button" onClick={() => compareStore.set([])} className="underline underline-offset-4 hover:text-charcoal">
          Clear all
        </button>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0" role="region" aria-label="Product comparison — scroll horizontally on small screens" tabIndex={0}>
        <table className="w-full min-w-[640px] table-fixed border-collapse font-ui text-[14px]">
          <caption className="sr-only">Product comparison</caption>
          <colgroup>
            <col className="w-[120px] md:w-[180px]" />
            {visible.map((p) => (
              <col key={p.id} className="w-[220px]" />
            ))}
          </colgroup>
          <thead>
            <tr>
              <td className="sticky left-0 z-10 bg-ivory" />
              {visible.map((p) => (
                <th key={p.id} scope="col" className="px-3 pb-6 text-left align-top font-normal">
                  <div className="relative aspect-[3/4] overflow-hidden bg-beige">
                    <Link href={`/product/${p.slug}`} aria-label={p.name} className="absolute inset-0">
                      {p.images[0] && <Image src={p.images[0].url} alt={p.images[0].alt} fill sizes="220px" className="object-cover" />}
                    </Link>
                    <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from comparison`} className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-ivory/90">
                      <X className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <Link href={`/product/${p.slug}`} className="mt-3 block text-[15px] font-medium hover:underline hover:underline-offset-4">
                    {p.name}
                  </Link>
                  <div className="mt-3 flex items-start gap-2">
                    <div className="flex-1">
                      <AddToBag product={p} />
                    </div>
                    <WishlistButton productId={p.id} name={p.name} className="border border-line-strong !rounded-none" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="sticky left-0 z-10 bg-ivory py-4 pr-3 text-left align-top text-[12px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  {row.label}
                </th>
                {visible.map((p) => (
                  <td key={p.id} className="px-3 py-4 align-top leading-relaxed">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
