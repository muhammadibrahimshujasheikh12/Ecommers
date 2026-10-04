"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { site } from "@/content/site";

export function AnnouncementBar() {
  const messages = site.announcements;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(t);
  }, [paused, messages.length]);

  const go = (d: number) => setIndex((i) => (i + d + messages.length) % messages.length);

  return (
    <div
      className="bg-blush text-charcoal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container-site grid h-9 grid-cols-[auto_1fr_auto] items-center md:h-10 lg:grid-cols-[1fr_auto_1fr]">
        <a href={site.contact.phoneHref} className="hidden font-ui text-[12px] tracking-[0.08em] text-ink-2 hover:text-charcoal lg:block">
          Customer care: {site.contact.phone}
        </a>
        <div className="col-span-3 flex items-center justify-between gap-3 lg:col-span-1 lg:justify-center lg:gap-6">
          <button type="button" onClick={() => go(-1)} aria-label="Previous announcement" className="grid size-8 place-items-center text-ink-2 hover:text-charcoal">
            <ChevronLeft className="size-3.5" strokeWidth={1.6} />
          </button>
          <p aria-live="polite" className="min-w-0 truncate text-center font-ui text-[12px] tracking-[0.08em] md:text-[13px] lg:min-w-[440px]">
            {messages[index]}
          </p>
          <button type="button" onClick={() => go(1)} aria-label="Next announcement" className="grid size-8 place-items-center text-ink-2 hover:text-charcoal">
            <ChevronRight className="size-3.5" strokeWidth={1.6} />
          </button>
        </div>
        <p className="hidden justify-self-end font-ui text-[12px] tracking-[0.08em] text-ink-2 lg:block">Pakistan · PKR Rs.</p>
      </div>
    </div>
  );
}
