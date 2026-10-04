"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { SectionHeading } from "@/components/ui/misc";
import { formatPrice } from "@/utils/format";
import type { ProductSummary } from "@/types/domain";
import { site } from "@/content/site";
import { cn } from "@/utils/cn";

type Reel = { product: ProductSummary; poster: string; duration: string; video?: string };

function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const { product } = reel;

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <article className="group relative aspect-[9/16] overflow-hidden bg-beige">
      {reel.video ? (
        <video ref={videoRef} src={reel.video} poster={reel.poster} muted playsInline loop preload="none" className="absolute inset-0 size-full object-cover" aria-label={`${product.name} campaign film`} />
      ) : (
        <Image src={reel.poster} alt={`${product.name} campaign still`} fill sizes="(min-width: 1024px) 23vw, 64vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(transparent,rgb(30_27_25/0.35))]" />
      <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1.5 font-ui text-[12px] tracking-[0.08em]">{reel.duration}</span>

      {reel.video ? (
        <button type="button" onClick={toggle} aria-label={playing ? `Pause ${product.name} film` : `Play ${product.name} film`} className="absolute left-1/2 top-[44%] grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 transition-transform hover:scale-105 md:size-16">
          {playing ? <Pause className="size-5" strokeWidth={1.5} /> : <Play className="ml-0.5 size-5 fill-current" strokeWidth={1.5} />}
        </button>
      ) : (
        <span aria-hidden className="absolute left-1/2 top-[44%] grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 md:size-16">
          <Play className="ml-0.5 size-5 fill-current" strokeWidth={1.5} />
        </span>
      )}

      {/* Product panel: always visible on touch, revealed on hover/focus on desktop */}
      <div className={cn("absolute inset-x-3 bottom-3 grid grid-cols-[48px_1fr] items-center gap-3 bg-ivory p-2.5 pr-3 transition-all duration-300", "md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100")}>
        <div className="relative aspect-[3/4] overflow-hidden bg-beige">
          {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="48px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-ui text-[14px] font-medium">{product.name}</p>
          <p className="font-ui text-[13px] text-ink-2">{formatPrice(product.price)}</p>
          <Link href={`/product/${product.slug}`} className="link-underline ui-label mt-1 inline-flex items-center gap-1.5 text-[11px]">
            Shop Now <ArrowRight className="size-3" strokeWidth={1.5} />
            <span className="sr-only">: {product.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function WatchAndShop({ reels }: { reels: Reel[] }) {
  if (!reels.length) return null;
  return (
    <section aria-labelledby="watch-heading" className="py-16 md:py-24 xl:py-32">
      <div className="container-site">
        <SectionHeading
          id="watch-heading"
          eyebrow="In Motion"
          title="Watch & Shop"
          action={
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="link-underline ui-label inline-flex items-center gap-2 text-[12px]">
              Follow @auraq.official <ArrowRight className="size-4" strokeWidth={1.4} />
            </a>
          }
        />
      </div>
      <ul className="scrollbar-none container-site flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:gap-6">
        {reels.map((reel) => (
          <li key={reel.product.id} className="w-[64%] shrink-0 snap-start md:w-auto">
            <ReelCard reel={reel} />
          </li>
        ))}
      </ul>
    </section>
  );
}
