"use client";

import { useState, type KeyboardEvent } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { AdminBadge, Table, Td, Th } from "@/features/admin/ui";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import { CellError, MiniLabel, cellInputClasses, units } from "./form-bits";
import { LOW_STOCK_THRESHOLD, LOW_VARIANT_STOCK, PRODUCT_LIMITS } from "./model";
import type { ProductFormInput, ProductFormOutput } from "./schema";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"] as const;
const HEX = /^#?[0-9A-Fa-f]{6}$/;

/** "Ivory Gold" -> "IG"; used to suggest variant SKUs. */
const colourCode = (colour: string) =>
  colour
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

const skuPart = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Variants table with inline stock editing, bulk stock, and a quick "colour × sizes" helper. */
export function VariantsEditor() {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<ProductFormInput, unknown, ProductFormOutput>();
  const { fields, append, remove } = useFieldArray({ control, name: "variants", keyName: "key" });
  const variants = useWatch({ control, name: "variants" }) ?? [];
  const productSku = useWatch({ control, name: "sku" }) ?? "";
  const basePrice = useWatch({ control, name: "price" }) ?? "";

  const [bulkStock, setBulkStock] = useState("");
  const [notice, setNotice] = useState("");
  const [run, setRun] = useState({ colour: "", hex: "", stock: "0", sizes: new Set<string>(["XS", "S", "M", "L", "XL"]) });

  const room = PRODUCT_LIMITS.variants - fields.length;
  const total = variants.reduce((n, v) => n + units(v?.stock), 0);
  const soldOut = variants.filter((v) => units(v?.stock) === 0).length;
  const basePriceNumber = Number(String(basePrice).replace(/[,\s]/g, ""));

  /** A SKU that no other row uses yet. */
  function uniqueSku(base: string, taken: Set<string>) {
    let sku = base.slice(0, 60);
    for (let n = 2; taken.has(sku); n++) sku = `${base.slice(0, 57)}-${n}`;
    taken.add(sku);
    return sku;
  }

  function addVariant() {
    const last = variants.at(-1);
    const taken = new Set(variants.map((v) => (v?.sku ?? "").toUpperCase()));
    append(
      {
        id: "",
        size: "",
        color: last?.color ?? "",
        colorHex: last?.colorHex ?? "",
        sku: uniqueSku(`${skuPart(productSku) || "SKU"}-${fields.length + 1}`, taken),
        price: "",
        stock: "0",
      },
      { focusName: `variants.${fields.length}.size` },
    );
  }

  function addSizeRun() {
    const colour = run.colour.trim();
    const existing = new Set(variants.map((v) => `${(v?.size ?? "").toLowerCase()}|${(v?.color ?? "").toLowerCase()}`));
    const taken = new Set(variants.map((v) => (v?.sku ?? "").toUpperCase()));
    const sizes = SIZES.filter((s) => run.sizes.has(s) && !existing.has(`${s.toLowerCase()}|${colour.toLowerCase()}`)).slice(0, room);
    if (!sizes.length) {
      setNotice(colour ? `${colour} already has those sizes.` : "Those sizes are already added.");
      return;
    }
    const prefix = [skuPart(productSku) || "SKU", colour ? colourCode(colour) : ""].filter(Boolean).join("-");
    const hex = HEX.test(run.hex) ? `#${run.hex.replace("#", "").toUpperCase()}` : "";
    append(
      sizes.map((size) => ({
        id: "",
        size,
        color: colour,
        colorHex: hex,
        sku: uniqueSku(`${prefix}-${skuPart(size)}`, taken),
        price: "",
        stock: /^\d{1,6}$/.test(run.stock.trim()) ? run.stock.trim() : "0",
      })),
      { shouldFocus: false },
    );
    setNotice(`Added ${sizes.length} ${sizes.length === 1 ? "variant" : "variants"}${colour ? ` in ${colour}` : ""}.`);
  }

  function applyBulkStock() {
    const value = bulkStock.trim().replace(/[,\s]/g, "");
    if (!/^\d{1,6}$/.test(value)) {
      setNotice("Enter a whole number of units to set for every variant.");
      return;
    }
    getValues("variants").forEach((_, i) => setValue(`variants.${i}.stock`, value, { shouldDirty: true, shouldValidate: true }));
    setNotice(`Stock set to ${Number(value).toLocaleString("en-US")} for all ${fields.length} variants.`);
    setBulkStock("");
  }

  /** Enter in the helper's inputs adds the sizes instead of submitting the product form. */
  const addOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSizeRun();
    }
  };

  return (
    <div className="space-y-6">
      <datalist id="admin-size-options">
        {SIZES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {fields.length === 0 ? (
        <div className="grid gap-4 rounded-[3px] border border-dashed border-line-strong bg-ivory/60 p-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-end">
          <p className="text-[14px] leading-relaxed text-ink-2">
            This product has no variants, so stock is tracked for the product as a whole. Add sizes or colours below to track stock for each
            option.
          </p>
          <Input
            label="Stock (units)"
            inputMode="numeric"
            error={errors.stock?.message}
            className="h-11"
            {...register("stock")}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="text-[14px] text-ink-2">
              <strong className="font-medium text-charcoal">{total.toLocaleString("en-US")} units</strong> across {fields.length}{" "}
              {fields.length === 1 ? "variant" : "variants"}
              {soldOut > 0 && <span className="text-sale"> · {soldOut} sold out</span>}
              {total > 0 && total <= LOW_STOCK_THRESHOLD && <span className="text-warning"> · low stock</span>}
            </p>
            <div className="flex items-end gap-2">
              <div>
                <MiniLabel htmlFor="bulk-stock">Set all stock to</MiniLabel>
                <input
                  id="bulk-stock"
                  inputMode="numeric"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyBulkStock();
                    }
                  }}
                  placeholder="e.g. 10"
                  className={cellInputClasses(false, "w-28")}
                />
              </div>
              <Button size="sm" variant="secondary" className="h-10 px-4" onClick={applyBulkStock}>
                Apply
              </Button>
            </div>
          </div>

          <Table label="Variants" className="min-w-[920px]">
            <thead>
              <tr>
                <Th className="w-10">#</Th>
                <Th>Colour</Th>
                <Th className="w-32">Hex</Th>
                <Th className="w-32">Size</Th>
                <Th>SKU</Th>
                <Th className="w-36">Price override</Th>
                <Th className="w-40">Stock</Th>
                <Th className="w-14">
                  <span className="sr-only">Remove</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => {
                const v = variants[i];
                const err = errors.variants?.[i];
                const stock = units(v?.stock);
                const hex = v?.colorHex && HEX.test(v.colorHex) ? `#${v.colorHex.replace("#", "")}` : null;
                const label = [v?.color, v?.size].filter(Boolean).join(" / ") || `variant ${i + 1}`;
                const id = (name: string) => `variant-${i}-${name}`;
                return (
                  <tr key={field.key} className="align-top">
                    <Td className="pt-5 text-[12px] tabular-nums text-ink-3">{i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          className="relative size-9 shrink-0 overflow-hidden rounded-full border border-line-strong"
                          style={{ background: hex ?? "repeating-linear-gradient(45deg, #fff 0 4px, #efe6d8 4px 8px)" }}
                        >
                          <input
                            type="color"
                            aria-label={`Pick colour for ${label}`}
                            value={hex ?? "#ffffff"}
                            onChange={(e) => setValue(`variants.${i}.colorHex`, e.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                          />
                        </span>
                        <input
                          aria-label={`Colour, variant ${i + 1}`}
                          placeholder="e.g. Mint"
                          aria-invalid={err?.color ? true : undefined}
                          aria-describedby={err?.color ? id("color-error") : undefined}
                          className={cellInputClasses(Boolean(err?.color), "min-w-[140px]")}
                          {...register(`variants.${i}.color`)}
                        />
                      </div>
                      <CellError id={id("color-error")} message={err?.color?.message} />
                    </Td>
                    <Td>
                      <input
                        aria-label={`Hex colour, variant ${i + 1}`}
                        placeholder="#C9D8CC"
                        aria-invalid={err?.colorHex ? true : undefined}
                        aria-describedby={err?.colorHex ? id("hex-error") : undefined}
                        className={cellInputClasses(Boolean(err?.colorHex), "uppercase")}
                        {...register(`variants.${i}.colorHex`)}
                      />
                      <CellError id={id("hex-error")} message={err?.colorHex?.message} />
                    </Td>
                    <Td>
                      <input
                        aria-label={`Size, variant ${i + 1}`}
                        list="admin-size-options"
                        placeholder="e.g. M"
                        aria-invalid={err?.size ? true : undefined}
                        aria-describedby={err?.size ? id("size-error") : undefined}
                        className={cellInputClasses(Boolean(err?.size))}
                        {...register(`variants.${i}.size`)}
                      />
                      <CellError id={id("size-error")} message={err?.size?.message} />
                    </Td>
                    <Td>
                      <input
                        aria-label={`SKU, variant ${i + 1}`}
                        aria-invalid={err?.sku ? true : undefined}
                        aria-describedby={err?.sku ? id("sku-error") : undefined}
                        className={cellInputClasses(Boolean(err?.sku), "min-w-[170px] uppercase")}
                        {...register(`variants.${i}.sku`)}
                      />
                      <CellError id={id("sku-error")} message={err?.sku?.message} />
                    </Td>
                    <Td>
                      <input
                        aria-label={`Price override, variant ${i + 1}`}
                        inputMode="decimal"
                        placeholder={Number.isFinite(basePriceNumber) && basePriceNumber > 0 ? formatPrice(basePriceNumber) : "Same as product"}
                        aria-invalid={err?.price ? true : undefined}
                        aria-describedby={err?.price ? id("price-error") : undefined}
                        className={cellInputClasses(Boolean(err?.price))}
                        {...register(`variants.${i}.price`)}
                      />
                      <CellError id={id("price-error")} message={err?.price?.message} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`Stock, variant ${i + 1}`}
                          inputMode="numeric"
                          aria-invalid={err?.stock ? true : undefined}
                          aria-describedby={err?.stock ? id("stock-error") : undefined}
                          className={cellInputClasses(Boolean(err?.stock), "w-20 tabular-nums")}
                          {...register(`variants.${i}.stock`)}
                        />
                        {!err?.stock && stock === 0 && <AdminBadge tone="danger">Out</AdminBadge>}
                        {!err?.stock && stock > 0 && stock <= LOW_VARIANT_STOCK && <AdminBadge tone="warning">Low</AdminBadge>}
                      </div>
                      <CellError id={id("stock-error")} message={err?.stock?.message} />
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => {
                          remove(i);
                          setNotice(`Removed ${label}.`);
                        }}
                        className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-blush hover:text-sale"
                      >
                        <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
                        <span className="sr-only">Remove {label}</span>
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {typeof errors.variants?.message === "string" && (
            <p role="alert" className="text-[13px] text-sale">
              {errors.variants.message}
            </p>
          )}
        </>
      )}

      <div className="rounded-[3px] border border-line bg-cream/40 p-4 md:p-5">
        <h3 className="font-ui text-[12px] font-semibold uppercase tracking-[0.12em]">Add a colour in several sizes</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_150px_110px]">
          <div>
            <MiniLabel htmlFor="run-colour">Colour</MiniLabel>
            <input
              id="run-colour"
              value={run.colour}
              onChange={(e) => setRun((r) => ({ ...r, colour: e.target.value }))}
              onKeyDown={addOnEnter}
              placeholder="e.g. Ivory Gold (optional)"
              maxLength={40}
              className={cellInputClasses(false)}
            />
          </div>
          <div>
            <MiniLabel htmlFor="run-hex">Hex</MiniLabel>
            <div className="flex items-center gap-2">
              <span
                className="relative size-9 shrink-0 overflow-hidden rounded-full border border-line-strong"
                style={{ background: HEX.test(run.hex) ? `#${run.hex.replace("#", "")}` : "repeating-linear-gradient(45deg, #fff 0 4px, #efe6d8 4px 8px)" }}
              >
                <input
                  type="color"
                  aria-label="Pick colour"
                  value={HEX.test(run.hex) ? `#${run.hex.replace("#", "")}` : "#ffffff"}
                  onChange={(e) => setRun((r) => ({ ...r, hex: e.target.value.toUpperCase() }))}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </span>
              <input
                id="run-hex"
                value={run.hex}
                onChange={(e) => setRun((r) => ({ ...r, hex: e.target.value }))}
                onKeyDown={addOnEnter}
                placeholder="#F4EEE2"
                maxLength={7}
                className={cellInputClasses(false, "uppercase")}
              />
            </div>
          </div>
          <div>
            <MiniLabel htmlFor="run-stock">Stock each</MiniLabel>
            <input
              id="run-stock"
              inputMode="numeric"
              value={run.stock}
              onChange={(e) => setRun((r) => ({ ...r, stock: e.target.value }))}
              onKeyDown={addOnEnter}
              className={cellInputClasses(false)}
            />
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">Sizes</legend>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => {
              const on = run.sizes.has(size);
              return (
                <label
                  key={size}
                  className={cn(
                    "inline-flex h-10 min-w-12 cursor-pointer items-center justify-center rounded-[2px] border px-3 font-ui text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    on ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-white/60 hover:border-charcoal",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() =>
                      setRun((r) => {
                        const sizes = new Set(r.sizes);
                        if (sizes.has(size)) sizes.delete(size);
                        else sizes.add(size);
                        return { ...r, sizes };
                      })
                    }
                  />
                  {size}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" onClick={addSizeRun} disabled={room <= 0 || run.sizes.size === 0} icon={<Plus aria-hidden className="size-4" strokeWidth={1.6} />}>
            Add {run.sizes.size} {run.sizes.size === 1 ? "size" : "sizes"}
          </Button>
          <Button size="sm" variant="ghost" onClick={addVariant} disabled={room <= 0}>
            Add single variant
          </Button>
          {room <= 0 && <p className="text-[13px] text-ink-3">A product can have up to {PRODUCT_LIMITS.variants} variants.</p>}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>
      {notice && (
        <p className="-mt-2 text-[13px] text-ink-2" aria-hidden>
          {notice}
        </p>
      )}
    </div>
  );
}
