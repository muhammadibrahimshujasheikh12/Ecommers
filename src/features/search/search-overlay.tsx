"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { MiniProductCard, MiniProductSkeleton, type MiniProduct } from "@/features/recommendations/mini-product-card";
import { PopularSearchLinks } from "@/features/recommendations/popular-searches";
import { useTrendingProducts } from "@/features/recommendations/use-trending-products";
import type { SearchSuggestions } from "@/lib/data/catalog";
import { cn } from "@/utils/cn";

const QUICK_LINKS = [
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Ready to Wear", href: "/category/ready-to-wear" },
  { label: "Formal", href: "/category/formals" },
  { label: "Best Sellers", href: "/shop?sort=best_selling" },
  { label: "Size Guide", href: "/size-guide" },
];

const RESULT_SIZES = "(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw";
const TRENDING_SIZES = "(min-width: 1440px) 240px, (min-width: 640px) 18vw, 45vw";

function TrendingGrid({ products, onNavigate }: { products: MiniProduct[] | null; onNavigate: () => void }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4" aria-busy={!products || undefined}>
      {products
        ? products.map((p) => (
            <li key={p.id}>
              <MiniProductCard product={p} sizes={TRENDING_SIZES} onNavigate={onNavigate} />
            </li>
          ))
        : [0, 1, 2, 3].map((i) => (
            <li key={i}>
              <MiniProductSkeleton />
            </li>
          ))}
    </ul>
  );
}

/** Large overlay on desktop, full screen on mobile, with instant suggestions. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestions | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const listId = useId();
  // Best sellers for the idle state, fetched the first time the overlay opens.
  const trending = useTrendingProducts(open);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResults((await res.json()) as SearchSuggestions);
        setStatus("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [term]);

  const visible = term.length >= 2 ? results : null;
  const submit = (q: string) => {
    if (!q.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  const empty = visible && !visible.products.length && !visible.categories.length && !visible.collections.length;
  const noProducts = visible && !visible.products.length;
  const related = visible
    ? [...visible.categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })), ...visible.collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}` }))]
    : [];
  const showTrending = !visible || noProducts;
  // Status belongs to the last typed query; ignore it once the field is cleared.
  const loading = status === "loading" && term.length >= 2;
  const errored = status === "error" && term.length >= 2;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="dialog-drawer m-0 !h-[100dvh] w-full max-w-none -translate-y-full open:translate-y-0 starting:open:-translate-y-full md:!h-auto md:max-h-[90dvh]"
    >
      <div className="container-site pb-10 pt-4 md:pb-16 md:pt-8">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="flex items-center gap-3 border-b border-charcoal pb-3 md:gap-5 md:pb-4"
        >
          <Search className="size-6 shrink-0 md:size-7" strokeWidth={1.2} aria-hidden />
          <label htmlFor={`${listId}-input`} className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            autoComplete="off"
            enterKeyHint="search"
            aria-controls={listId}
            className="min-w-0 flex-1 bg-transparent font-ui text-[22px] font-light tracking-[0.01em] placeholder:text-ink-3 focus:outline-none md:text-[34px]"
          />
          {loading && <Loader2 className="size-5 animate-spin text-ink-3" aria-label="Searching" />}
          <button type="button" onClick={onClose} className="grid size-11 place-items-center" aria-label="Close search">
            <X className="size-6" strokeWidth={1.2} />
          </button>
        </form>

        <div id={listId} className="mt-8 grid gap-10 md:mt-10 md:grid-cols-12 md:gap-6">
          <aside className={cn("md:col-span-3", visible && "order-2 md:order-none")}>
            <PopularSearchLinks onNavigate={onClose} className="mb-9" />
            <p className="eyebrow mb-4">{related.length ? "Categories & collections" : "Quick links"}</p>
            <ul className="space-y-3">
              {(related.length ? related : QUICK_LINKS).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onClose} className="font-ui text-[16px] hover:text-ink-2">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div className="md:col-span-9">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <p className="eyebrow" aria-live="polite">
                {errored
                  ? "Search is unavailable right now"
                  : visible
                    ? visible.products.length
                      ? `Products matching “${term}”`
                      : `No products for “${term}”`
                    : "Trending now"}
              </p>
              {visible && visible.products.length > 0 ? (
                <button type="button" onClick={() => submit(query)} className="link-underline inline-flex shrink-0 items-center gap-2 font-ui text-[12px] font-medium uppercase tracking-[0.16em]">
                  View all results <ArrowRight className="size-3.5" strokeWidth={1.5} />
                </button>
              ) : (
                !visible && (
                  <Link href="/shop?sort=best_selling" onClick={onClose} className="link-underline inline-flex shrink-0 items-center gap-2 font-ui text-[12px] font-medium uppercase tracking-[0.16em]">
                    Best sellers <ArrowRight className="size-3.5" strokeWidth={1.5} />
                  </Link>
                )
              )}
            </div>

            {visible && visible.products.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
                {visible.products.map((p) => (
                  <li key={p.id}>
                    <MiniProductCard product={p} sizes={RESULT_SIZES} onNavigate={onClose} />
                  </li>
                ))}
              </ul>
            )}

            {noProducts && (
              <p className="max-w-md pb-8 text-ink-2">
                {empty
                  ? `We couldn’t find anything for “${term}”. Try a different spelling, or search for “lawn”, “formal” or a colour such as “blush”.`
                  : `No pieces by that name yet — “${term}” matches the ${related.length === 1 ? "page" : "pages"} listed under Categories & collections.`}
              </p>
            )}

            {showTrending && trending?.length !== 0 && (
              <>
                {noProducts && <p className="eyebrow mb-4">Trending now</p>}
                <TrendingGrid products={trending} onNavigate={onClose} />
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
