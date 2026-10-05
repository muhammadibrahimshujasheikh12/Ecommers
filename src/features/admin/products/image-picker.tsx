"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { cellInputClasses } from "./form-bits";
import { BodyPortal } from "./portal";

/** "/images/products/gul-e-nar-2.jpg" -> "Gul E Nar · 2" */
export function libraryLabel(url: string): string {
  const file = url.split("/").pop() ?? url;
  const base = file.replace(/\.[a-z0-9]+$/i, "");
  const match = base.match(/^(.*?)-(\d+)$/);
  const words = (match ? match[1] : base).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return match ? `${words.join(" ")} · ${match[2]}` : words.join(" ");
}

/**
 * Picks photos from the bundled library (public/images/products). The demo
 * store has no Storage bucket, so this is how it adds product images.
 */
export function ImagePicker({
  open,
  library,
  taken,
  room,
  onAdd,
  onClose,
}: {
  open: boolean;
  library: string[];
  taken: Set<string>;
  room: number;
  onAdd: (urls: string[]) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const shown = useMemo(() => {
    const t = term.trim().toLowerCase();
    return t ? library.filter((url) => libraryLabel(url).toLowerCase().includes(t)) : library;
  }, [library, term]);

  const close = () => {
    setPicked([]);
    setTerm("");
    onClose();
  };

  const toggle = (url: string) =>
    setPicked((p) => (p.includes(url) ? p.filter((u) => u !== url) : p.length < room ? [...p, url] : p));

  return (
    <BodyPortal>
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={close}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="m-auto h-[min(760px,calc(100dvh-32px))] w-[calc(100%-24px)] max-w-[980px] rounded-[3px] border border-line bg-ivory p-0 text-charcoal shadow-[var(--shadow-overlay)]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 md:px-6">
          <div>
            <h2 id={titleId} className="font-display text-[26px] font-medium leading-tight">
              Image library
            </h2>
            <p className="text-[13px] text-ink-3">
              {room > 0 ? `Choose up to ${room} ${room === 1 ? "photo" : "photos"}. The first image is the main one.` : "This product already has the maximum number of images."}
            </p>
          </div>
          <button type="button" onClick={close} className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-cream" aria-label="Close image library">
            <X aria-hidden className="size-5" strokeWidth={1.4} />
          </button>
        </div>

        <div className="border-b border-line px-5 py-3 md:px-6">
          <label htmlFor={`${titleId}-search`} className="sr-only">
            Search the library
          </label>
          <div className="relative max-w-sm">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
            <input
              id={`${titleId}-search`}
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, e.g. gulab"
              className={cellInputClasses(false, "pl-9")}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">
          {shown.length === 0 ? (
            <p className="py-16 text-center text-[14px] text-ink-3">No photos match “{term}”.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {shown.map((url) => {
                const added = taken.has(url);
                const on = picked.includes(url);
                const label = libraryLabel(url);
                return (
                  <li key={url}>
                    <button
                      type="button"
                      onClick={() => toggle(url)}
                      disabled={added || (!on && picked.length >= room)}
                      aria-pressed={on}
                      className={cn(
                        "group relative block w-full overflow-hidden rounded-[2px] text-left outline-offset-2 transition disabled:cursor-not-allowed",
                        on ? "ring-2 ring-charcoal ring-offset-2 ring-offset-ivory" : "hover:opacity-90",
                      )}
                    >
                      <span className="relative block aspect-[3/4] bg-beige">
                        <Image src={url} alt="" fill sizes="(min-width: 768px) 150px, 30vw" className={cn("object-cover", added && "opacity-40")} />
                        {on && (
                          <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-charcoal text-ivory">
                            <Check aria-hidden className="size-3.5" strokeWidth={2} />
                          </span>
                        )}
                        {added && (
                          <span className="absolute inset-x-0 bottom-0 bg-ivory/90 py-1 text-center font-ui text-[10px] uppercase tracking-[0.12em]">
                            Added
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 block truncate text-[12px] text-ink-2">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 md:px-6">
          <p className="text-[13px] text-ink-2" aria-live="polite">
            {picked.length ? `${picked.length} selected` : "Nothing selected yet"}
          </p>
          <div className="flex gap-3">
            <Button size="sm" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!picked.length}
              onClick={() => {
                onAdd(picked);
                close();
              }}
            >
              Add {picked.length > 1 ? `${picked.length} images` : "image"}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
    </BodyPortal>
  );
}
