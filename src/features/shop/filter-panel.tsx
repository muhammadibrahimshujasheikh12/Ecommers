"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { Facets } from "@/types/domain";
import { cn } from "@/utils/cn";

type Props = {
  facets: Facets;
  /** Hide facets fixed by the page (e.g. category on a category page). */
  hide?: ("category" | "collection")[];
  total: number;
  activeCount: number;
};

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  // Reflect the new filter state immediately while the server renders the results.
  const [optimisticQs, setOptimisticQs] = useOptimistic(searchParams.toString());
  const params = new URLSearchParams(optimisticQs);

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(optimisticQs);
    mutate(next);
    next.delete("page");
    const qs = next.toString();
    start(() => {
      setOptimisticQs(qs);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const values = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggle = (key: string, value: string) =>
    update((p) => {
      const set = new Set(values(key));
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size) p.set(key, [...set].join(","));
      else p.delete(key);
    });
  const setOne = (key: string, value: string | null) => update((p) => (value ? p.set(key, value) : p.delete(key)));

  return { params, pending, values, toggle, setOne, update };
}

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-5">
      <summary className="flex cursor-pointer items-center justify-between font-ui text-[13px] font-medium uppercase tracking-[0.16em]">
        {title}
        <span aria-hidden className="text-[18px] font-light leading-none">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

function CheckRow({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3 font-ui text-[14px] text-ink-2 hover:text-charcoal">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-charcoal" />
      <span className={cn(checked && "text-charcoal")}>{label}</span>
      {count !== undefined && <span className="text-ink-3">({count})</span>}
    </label>
  );
}

function PriceRange({ facets }: { facets: Facets }) {
  const { params, update } = useFilterNavigation();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        update((p) => {
          if (min) p.set("min", String(Math.max(0, Number(min) || 0)));
          else p.delete("min");
          if (max) p.set("max", String(Math.max(0, Number(max) || 0)));
          else p.delete("max");
        });
      }}
    >
      {[
        { id: "price-min", label: "Min", value: min, set: setMin, placeholder: String(Math.floor(facets.price.min)) },
        { id: "price-max", label: "Max", value: max, set: setMax, placeholder: String(Math.ceil(facets.price.max)) },
      ].map((f) => (
        <label key={f.id} htmlFor={f.id} className="flex-1">
          <span className="mb-1.5 block font-ui text-[12px] text-ink-3">{f.label} (Rs.)</span>
          <input
            id={f.id}
            inputMode="numeric"
            pattern="[0-9]*"
            value={f.value}
            onChange={(e) => f.set(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={f.placeholder}
            className="h-10 w-full rounded-[2px] border border-line-strong bg-white/60 px-2.5 font-ui text-[14px] focus:border-charcoal focus:outline-none"
          />
        </label>
      ))}
      <Button type="submit" variant="secondary" size="sm" className="h-10 px-3">
        Go
      </Button>
    </form>
  );
}

function FilterGroups({ facets, hide = [] }: Pick<Props, "facets" | "hide">) {
  const { params, values, toggle, setOne } = useFilterNavigation();
  const categories = values("category");
  const collections = values("collection");
  const sizes = values("size");
  const colors = values("color");

  return (
    <div>
      {!hide.includes("category") && facets.categories.length > 1 && (
        <Group title="Category">
          {facets.categories.map((c) => (
            <CheckRow key={c.slug} label={c.name} checked={categories.includes(c.slug)} onChange={() => toggle("category", c.slug)} />
          ))}
        </Group>
      )}
      {!hide.includes("collection") && facets.collections.length > 0 && (
        <Group title="Collection">
          {facets.collections.map((c) => (
            <CheckRow key={c.slug} label={c.name} checked={collections.includes(c.slug)} onChange={() => toggle("collection", c.slug)} />
          ))}
        </Group>
      )}
      <Group title="Price">
        <PriceRange key={`${params.get("min")}-${params.get("max")}`} facets={facets} />
      </Group>
      <Group title="Availability">
        {[
          { v: "in_stock", l: "In stock" },
          { v: "out_of_stock", l: "Sold out" },
        ].map((o) => (
          <CheckRow key={o.v} label={o.l} checked={params.get("availability") === o.v} onChange={() => setOne("availability", params.get("availability") === o.v ? null : o.v)} />
        ))}
      </Group>
      {facets.sizes.length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sizes">
            {facets.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sizes.includes(s)}
                onClick={() => toggle("size", s)}
                className={cn(
                  "h-10 min-w-12 border px-3 font-ui text-[13px] tracking-[0.06em] transition-colors",
                  sizes.includes(s) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong hover:border-charcoal",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Group>
      )}
      {facets.colors.length > 0 && (
        <Group title="Colour">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {facets.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-pressed={colors.includes(c.name)}
                onClick={() => toggle("color", c.name)}
                className="flex min-h-8 items-center gap-2.5 text-left font-ui text-[13px] text-ink-2 hover:text-charcoal"
              >
                <span
                  className={cn("size-5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(42_40_38/0.15)]", colors.includes(c.name) && "outline outline-1 outline-offset-2 outline-charcoal")}
                  style={{ backgroundColor: c.hex ?? "#ddd" }}
                />
                <span className={cn(colors.includes(c.name) && "text-charcoal")}>{c.name}</span>
              </button>
            ))}
          </div>
        </Group>
      )}
      <Group title="Rating" defaultOpen={false}>
        {[4, 3].map((r) => (
          <CheckRow key={r} label={`${r} stars & up`} checked={params.get("rating") === String(r)} onChange={() => setOne("rating", params.get("rating") === String(r) ? null : String(r))} />
        ))}
      </Group>
      <Group title="Offers" defaultOpen={false}>
        <CheckRow label="On sale" checked={params.get("sale") === "1"} onChange={() => setOne("sale", params.get("sale") === "1" ? null : "1")} />
      </Group>
    </div>
  );
}

/** Desktop sidebar */
export function FilterSidebar(props: Props) {
  const { pending } = useFilterNavigation();
  return (
    <aside aria-label="Filters" className={cn("hidden transition-opacity lg:block", pending && "opacity-60")}>
      <div className="sticky top-[150px] max-h-[calc(100dvh-170px)] overflow-y-auto pb-8 pr-2">
        <p className="ui-label border-b border-line pb-4">Filter</p>
        <FilterGroups facets={props.facets} hide={props.hide} />
      </div>
    </aside>
  );
}

/** Mobile/tablet drawer */
export function FilterDrawerButton(props: Props) {
  const [open, setOpen] = useState(false);
  const { update, pending } = useFilterNavigation();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2.5 border border-line-strong px-4 font-ui text-[12px] font-medium uppercase tracking-[0.14em] lg:hidden"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.4} />
        Filter{props.activeCount ? ` (${props.activeCount})` : ""}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title="Filter"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() =>
                update((p) => {
                  for (const k of ["category", "collection", "min", "max", "availability", "size", "color", "rating", "sale"]) p.delete(k);
                })
              }
            >
              Clear
            </Button>
            <Button className="flex-1" loading={pending} onClick={() => setOpen(false)}>
              Show {props.total} {props.total === 1 ? "result" : "results"}
            </Button>
          </div>
        }
      >
        <div className="px-5 md:px-7">
          <FilterGroups facets={props.facets} hide={props.hide} />
        </div>
      </Drawer>
    </>
  );
}

export function SortSelect({ options }: { options: { value: string; label: string }[] }) {
  const { params, setOne, pending } = useFilterNavigation();
  const current = params.get("sort") ?? "featured";
  return (
    <label className="relative inline-flex min-w-0 items-center">
      <span className="sr-only">Sort products</span>
      <select
        value={current}
        onChange={(e) => setOne("sort", e.target.value === "featured" ? null : e.target.value)}
        aria-busy={pending}
        className="h-11 w-full min-w-0 appearance-none truncate border border-line-strong bg-transparent pl-4 pr-10 font-ui text-[12px] font-medium uppercase tracking-[0.12em] focus:border-charcoal focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-3.5 size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </label>
  );
}
