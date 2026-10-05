"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { ExternalLink, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { Table, Td, Th } from "@/features/admin/ui";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import { setProductsFeaturedAction, setProductsStatusAction } from "./actions";
import { StockCell } from "./badges";
import { PRODUCT_STATUSES, STATUS_LABELS, type AdminProductRow, type ProductStatus } from "./model";
import { ProductThumb } from "./thumb";

type Patch = { ids: string[]; status?: ProductStatus; featured?: boolean };

const checkboxClasses =
  "size-[18px] shrink-0 cursor-pointer appearance-none rounded-[2px] border border-line-strong bg-white/60 bg-center bg-no-repeat transition-colors checked:border-charcoal checked:bg-charcoal checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22><path%20d=%22M3.5%208.5l3%203%206-7%22%20fill=%22none%22%20stroke=%22%23fbf8f3%22%20stroke-width=%221.8%22/></svg>')] indeterminate:border-charcoal indeterminate:bg-charcoal indeterminate:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22><path%20d=%22M4%208h8%22%20fill=%22none%22%20stroke=%22%23fbf8f3%22%20stroke-width=%221.8%22/></svg>')]";

/** Products table with row selection, bulk actions and quick status/featured changes (with undo). */
export function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [optimisticRows, applyPatch] = useOptimistic(rows, (current: AdminProductRow[], patch: Patch) =>
    current.map((r) =>
      patch.ids.includes(r.id) ? { ...r, status: patch.status ?? r.status, featured: patch.featured ?? r.featured } : r,
    ),
  );

  // Only rows on this page can be selected (filters and paging reset the rest).
  const selectedRows = useMemo(() => optimisticRows.filter((r) => selected.has(r.id)), [optimisticRows, selected]);
  const allSelected = optimisticRows.length > 0 && selectedRows.length === optimisticRows.length;
  const someSelected = selectedRows.length > 0 && !allSelected;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function restoreStatuses(previous: Map<ProductStatus, string[]>) {
    startTransition(async () => {
      for (const [status, ids] of previous) {
        applyPatch({ ids, status });
        const res = await setProductsStatusAction(ids, status);
        if (!res.ok) {
          toast({ tone: "error", message: res.error });
          return;
        }
      }
      toast({ message: "Change undone." });
    });
  }

  function changeStatus(targets: AdminProductRow[], status: ProductStatus) {
    const changing = targets.filter((r) => r.status !== status);
    if (!changing.length) return;
    const previous = new Map<ProductStatus, string[]>();
    for (const r of changing) previous.set(r.status, [...(previous.get(r.status) ?? []), r.id]);

    startTransition(async () => {
      applyPatch({ ids: changing.map((r) => r.id), status });
      const res = await setProductsStatusAction(
        changing.map((r) => r.id),
        status,
      );
      if (!res.ok) {
        toast({ tone: "error", message: res.error });
        return;
      }
      setSelected(new Set());
      const message = changing.length === 1 ? `${changing[0].name} set to ${STATUS_LABELS[status].toLowerCase()}.` : (res.message ?? "Products updated.");
      toast({ message, action: res.data.changed ? { label: "Undo", onClick: () => restoreStatuses(previous) } : undefined });
    });
  }

  function changeFeatured(targets: AdminProductRow[], featured: boolean) {
    const changing = targets.filter((r) => r.featured !== featured);
    if (!changing.length) return;
    const ids = changing.map((r) => r.id);
    startTransition(async () => {
      applyPatch({ ids, featured });
      const res = await setProductsFeaturedAction(ids, featured);
      if (!res.ok) {
        toast({ tone: "error", message: res.error });
        return;
      }
      setSelected(new Set());
      const message =
        changing.length === 1 ? `${changing[0].name} ${featured ? "is now featured" : "is no longer featured"}.` : (res.message ?? "Products updated.");
      toast({
        message,
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              applyPatch({ ids, featured: !featured });
              const undo = await setProductsFeaturedAction(ids, !featured);
              toast(undo.ok ? { message: "Change undone." } : { tone: "error", message: undo.error });
            }),
        },
      });
    });
  }

  return (
    <div aria-busy={pending || undefined}>
      {selectedRows.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="mb-4 flex flex-wrap items-center gap-2 rounded-[3px] border border-charcoal/15 bg-cream px-4 py-3"
        >
          <p className="mr-2 font-ui text-[13px] font-medium" aria-live="polite">
            {selectedRows.length} selected
          </p>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => changeStatus(selectedRows, "active")}>
            Set active
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => changeStatus(selectedRows, "draft")}>
            Set draft
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => changeStatus(selectedRows, "archived")}>
            Archive
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => changeFeatured(selectedRows, true)}>
            Feature
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => changeFeatured(selectedRows, false)}>
            Unfeature
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto min-h-10 font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal"
          >
            Clear selection
          </button>
        </div>
      )}

      <Table label="Products" className="min-w-[1040px]">
        <thead>
          <tr>
            <Th className="w-12">
              <input
                type="checkbox"
                aria-label={allSelected ? "Deselect all products on this page" : "Select all products on this page"}
                className={checkboxClasses}
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => setSelected(allSelected ? new Set() : new Set(optimisticRows.map((r) => r.id)))}
              />
            </Th>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Category</Th>
            <Th align="right">Price</Th>
            <Th align="right">Stock</Th>
            <Th>Status</Th>
            <Th align="center">Featured</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {optimisticRows.map((row) => (
            <tr key={row.id} className={cn("transition-colors hover:bg-cream/50", selected.has(row.id) && "bg-cream/70")}>
              <Td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.name}`}
                  className={checkboxClasses}
                  checked={selected.has(row.id)}
                  onChange={() => toggle(row.id)}
                />
              </Td>
              <Td>
                <Link href={`/admin/products/${row.id}`} className="group flex min-w-[220px] items-center gap-3.5">
                  <ProductThumb url={row.image?.url} alt="" className="w-11" />
                  <span className="min-w-0">
                    <span className="block font-medium text-charcoal group-hover:underline group-hover:underline-offset-4">{row.name}</span>
                    <span className="block truncate text-[12px] text-ink-3">/{row.slug}</span>
                  </span>
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-[13px] tabular-nums text-ink-2">{row.sku}</Td>
              <Td className="text-ink-2">{row.category?.name ?? <span className="text-ink-3">—</span>}</Td>
              <Td align="right">
                <span className={cn("block whitespace-nowrap", row.compareAtPrice ? "font-medium text-sale" : "text-charcoal")}>
                  {formatPrice(row.price)}
                </span>
                {row.compareAtPrice !== null && (
                  <s className="block whitespace-nowrap text-[12px] text-ink-3">
                    <span className="sr-only">Compare at </span>
                    {formatPrice(row.compareAtPrice)}
                  </s>
                )}
              </Td>
              <Td align="right">
                <StockCell stock={row.stock} variantCount={row.variantCount} soldOutVariants={row.soldOutVariants} />
              </Td>
              <Td>
                <label className="sr-only" htmlFor={`status-${row.id}`}>
                  Status of {row.name}
                </label>
                <div className="relative inline-block">
                  <select
                    id={`status-${row.id}`}
                    value={row.status}
                    disabled={pending}
                    onChange={(e) => changeStatus([row], e.target.value as ProductStatus)}
                    className={cn(
                      "h-9 appearance-none rounded-full border-0 pl-3.5 pr-8 font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-charcoal focus-visible:outline-2",
                      row.status === "active" ? "bg-sage/70" : row.status === "draft" ? "bg-[#f3e2b8]" : "bg-line",
                    )}
                  >
                    {PRODUCT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </Td>
              <Td align="center">
                <button
                  type="button"
                  aria-pressed={row.featured}
                  aria-label={`Featured: ${row.name}`}
                  title={row.featured ? "Featured — click to unfeature" : "Not featured — click to feature"}
                  disabled={pending}
                  onClick={() => changeFeatured([row], !row.featured)}
                  className="mx-auto grid size-10 place-items-center rounded-full transition-colors hover:bg-cream disabled:opacity-60"
                >
                  <Star aria-hidden className={cn("size-[18px]", row.featured ? "fill-charcoal text-charcoal" : "text-ink-3")} strokeWidth={1.5} />
                </button>
              </Td>
              <Td align="right">
                <div className="flex items-center justify-end gap-1">
                  {row.status === "active" && (
                    <a
                      href={`/product/${row.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-cream hover:text-charcoal"
                    >
                      <ExternalLink aria-hidden className="size-4" strokeWidth={1.5} />
                      <span className="sr-only">View {row.name} in the store (opens in a new tab)</span>
                    </a>
                  )}
                  <Link
                    href={`/admin/products/${row.id}`}
                    className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-cream hover:text-charcoal"
                  >
                    <Pencil aria-hidden className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Edit {row.name}</span>
                  </Link>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
