"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { heroSlides as Slides } from "@/content/home";
import { cn } from "@/utils/cn";

const INTERVAL = 7000;

/** Art-directed picture: separate desktop and mobile crops, one download. */
function ArtPicture({ desktop, mobile, alt, priority }: { desktop: string; mobile: string; alt: string; priority: boolean }) {
  const common = { alt, fill: true, sizes: "100vw", priority, fetchPriority: priority ? ("high" as const) : undefined };
  const { props: desktopProps } = getImageProps({ ...common, src: desktop });
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: mobile, sizes: "100vw" });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopProps.srcSet} sizes="100vw" />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in props */}
      <img {...desktopProps} className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(motionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function HeroCarousel({ slides }: { slides: typeof Slides }) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false);
  // Autoplay is off for visitors who prefer reduced motion (they can still start it).
  const [userPlay, setUserPlay] = useState(false);
  const playing = !userPaused && (!reducedMotion || userPlay);
  const setPlaying = (next: boolean) => {
    setUserPaused(!next);
    setUserPlay(next);
  };
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);
  const total = slides.length;

  const go = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (!playing || hovered || total < 2) return;
    const t = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, playing, hovered, go, total]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured campaigns"
      className="relative h-[min(78svh,720px)] min-h-[540px] overflow-hidden bg-charcoal text-ivory md:h-[680px] xl:h-[820px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${total}: ${slide.title}`}
            aria-hidden={!active}
            inert={!active}
            className={cn("absolute inset-0 transition-opacity duration-[900ms] ease-[var(--ease-standard)]", active ? "opacity-100" : "opacity-0")}
          >
            <div className={cn("absolute inset-0 transition-transform duration-[7000ms] ease-linear", active ? "scale-100" : "scale-[1.04]")}>
              <ArtPicture desktop={slide.image.desktop} mobile={slide.image.mobile} alt={slide.image.alt} priority={i === 0} />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(30_27_25/0.55),rgb(30_27_25/0)_55%)] md:bg-[linear-gradient(90deg,rgb(30_27_25/0.38),rgb(30_27_25/0)_58%)]" />
            <div className="container-site absolute inset-x-0 bottom-20 md:bottom-36">
              <div className={cn("mx-auto max-w-xl text-center md:mx-0 md:max-w-[46%] md:text-left xl:max-w-[640px]", active && "[&>*]:animate-fade-up")}>
                <p className="eyebrow !text-ivory/90">{slide.eyebrow}</p>
                <Heading className="heading-display mt-3 [animation-delay:80ms]">{slide.title}</Heading>
                <p className="mt-4 text-[15px] text-ivory/90 [animation-delay:160ms] md:mt-5 md:text-[17px]">{slide.subtitle}</p>
                <Link href={slide.cta.href} className={buttonClasses({ variant: "light", className: "mt-7 [animation-delay:240ms] md:mt-9" })}>
                  {slide.cta.label}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {total > 1 && (
        <div className="container-site absolute inset-x-0 bottom-6 flex items-center justify-center gap-5 md:bottom-12 md:justify-start md:gap-7">
          <p className="hidden font-ui text-[13px] tabular-nums tracking-[0.16em] md:block" aria-hidden>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${s.title}`}
                aria-current={i === index}
                className="relative h-6 w-8 md:w-14"
              >
                <span className="absolute inset-x-0 top-1/2 h-px bg-ivory/40" />
                <span
                  key={`${index}-${playing}-${hovered}`}
                  className={cn("absolute inset-x-0 top-1/2 h-px origin-left bg-ivory", i < index ? "scale-x-100" : i === index ? (playing && !hovered ? "animate-[grow_7s_linear_forwards]" : "scale-x-100") : "scale-x-0")}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="grid size-10 place-items-center rounded-full transition-colors hover:bg-ivory/15"
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
          >
            {playing ? <Pause className="size-3.5" strokeWidth={1.6} /> : <Play className="size-3.5" strokeWidth={1.6} />}
          </button>
          <div className="ml-auto hidden gap-1 md:flex">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="grid size-12 place-items-center rounded-full transition-colors hover:bg-ivory/15">
              <ChevronLeft className="size-5" strokeWidth={1.3} />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="grid size-12 place-items-center rounded-full transition-colors hover:bg-ivory/15">
              <ChevronRight className="size-5" strokeWidth={1.3} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
