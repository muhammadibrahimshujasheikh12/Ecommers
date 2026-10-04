"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { ImageAsset } from "@/types/domain";
import { cn } from "@/utils/cn";

/**
 * Product gallery: thumbnails, hover zoom (desktop), swipeable strip (mobile)
 * and a full-screen lightbox (all devices).
 */
export function ProductGallery({ images, name }: { images: ImageAsset[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (lightbox && !d.open) d.showModal();
    if (!lightbox && d.open) d.close();
  }, [lightbox]);

  const scrollTo = (i: number) => {
    setActive(i);
    const strip = stripRef.current;
    if (strip) strip.scrollTo({ left: i * strip.clientWidth, behavior: "smooth" });
  };

  if (!images.length) return <div className="aspect-[3/4] bg-beige" />;
  const current = images[active];

  return (
    <div className="grid gap-4 lg:grid-cols-[88px_1fr] lg:gap-5">
      {/* Thumbnails (desktop) */}
      <ul className="hidden flex-col gap-3 lg:flex" aria-label="Product images">
        {images.map((img, i) => (
          <li key={img.url}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={cn("relative block aspect-[3/4] w-full overflow-hidden bg-beige transition-opacity", i === active ? "outline outline-1 outline-offset-2 outline-charcoal" : "opacity-70 hover:opacity-100")}
            >
              <Image src={img.url} alt="" fill sizes="88px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {/* Main image (desktop: hover zoom) */}
      <div className="relative hidden lg:block">
        <button
          type="button"
          className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden bg-beige"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
          aria-label={`Open full-screen view of ${current.alt}`}
        >
          <Image
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1440px) 720px, 52vw"
            className="object-cover transition-transform duration-200 ease-out"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          <span className="pointer-events-none absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-ivory/90">
            <ZoomIn className="size-4" strokeWidth={1.4} />
          </span>
        </button>
      </div>

      {/* Mobile: swipe strip with dots */}
      <div className="relative -mx-4 lg:hidden">
        <div
          ref={stripRef}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-label="Product images — swipe to browse"
        >
          {images.map((img, i) => (
            <button key={img.url} type="button" onClick={() => setLightbox(true)} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-beige" aria-label={`Open image ${i + 1} full screen`}>
              <Image src={img.url} alt={i === 0 ? img.alt : `${name} — view ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {images.map((img, i) => (
              <button key={img.url} type="button" onClick={() => scrollTo(i)} aria-label={`Go to image ${i + 1}`} className="grid size-6 place-items-center">
                <span className={cn("block h-1.5 rounded-full transition-all", i === active ? "w-5 bg-charcoal" : "w-1.5 bg-charcoal/30")} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <dialog
        ref={dialogRef}
        aria-label={`${name} images`}
        onClose={() => setLightbox(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ivory p-0 backdrop:bg-charcoal/60"
      >
        <div className="relative flex h-full items-center justify-center">
          <button type="button" onClick={() => setLightbox(false)} aria-label="Close" className="absolute right-3 top-3 z-10 grid size-12 place-items-center rounded-full bg-ivory/80">
            <X className="size-5" strokeWidth={1.4} />
          </button>
          <div className="relative h-full w-full max-w-[min(100vw,75dvh)]">
            <Image src={current.url} alt={current.alt} fill sizes="100vw" quality={85} className="object-contain" />
          </div>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => setActive((active - 1 + images.length) % images.length)} aria-label="Previous image" className="absolute left-3 grid size-12 place-items-center rounded-full bg-ivory/80">
                <ChevronLeft className="size-5" strokeWidth={1.4} />
              </button>
              <button type="button" onClick={() => setActive((active + 1) % images.length)} aria-label="Next image" className="absolute right-3 grid size-12 place-items-center rounded-full bg-ivory/80">
                <ChevronRight className="size-5" strokeWidth={1.4} />
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
