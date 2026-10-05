"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/providers/toast-provider";
import { Panel, formatDateTime } from "@/features/admin/ui";
import { cn } from "@/utils/cn";
import { discountPercent, formatPrice } from "@/utils/format";
import { checkProductSlugAction, saveProductAction } from "./actions";
import { CategoryOptions } from "./category-options";
import { DangerZone } from "./danger-zone";
import { DetailsEditor } from "./details-editor";
import { ImagesEditor } from "./images-editor";
import {
  PRODUCT_STATUSES,
  SLUG_PATTERN,
  STATUS_HINTS,
  STATUS_LABELS,
  slugify,
  type AdminProductDetail,
  type ProductFormOptions,
} from "./model";
import { productFormSchema, type ProductFormInput, type ProductFormOutput } from "./schema";
import { VariantsEditor } from "./variants-editor";

const asText = (n: number | null) => (n === null ? "" : String(n));

function toFormValues(product: AdminProductDetail | null): ProductFormInput {
  if (!product) {
    return {
      name: "",
      slug: "",
      sku: "",
      status: "draft",
      featured: false,
      categoryId: "",
      collectionIds: [],
      shortDescription: "",
      description: "",
      material: "",
      careInstructions: "",
      details: [],
      price: "",
      compareAtPrice: "",
      stock: "0",
      variants: [],
      images: [],
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    status: product.status,
    featured: product.featured,
    categoryId: product.categoryId ?? "",
    collectionIds: product.collectionIds,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    material: product.material ?? "",
    careInstructions: product.careInstructions ?? "",
    details: product.details,
    price: asText(product.price),
    compareAtPrice: asText(product.compareAtPrice),
    stock: String(product.stock),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size ?? "",
      color: v.color ?? "",
      colorHex: v.colorHex ?? "",
      sku: v.sku,
      price: asText(v.price),
      stock: String(v.stock),
    })),
    images: product.images.map((i) => ({ id: i.id ?? "", url: i.url, alt: i.alt })),
  };
}

type SlugCheck = { slug: string; available: boolean; usedBy: string | null };

/** Create / edit form for a product with its variants, images and details. */
export function ProductEditor({ product, options }: { product: AdminProductDetail | null; options: ProductFormOptions }) {
  const router = useRouter();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [slugCheck, setSlugCheck] = useState<SlugCheck | null>(null);

  const methods = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    mode: "onTouched",
    defaultValues: toFormValues(product),
  });
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = methods;

  const slug = (useWatch({ control, name: "slug" }) ?? "").trim().toLowerCase();
  const status = useWatch({ control, name: "status" });
  const priceText = useWatch({ control, name: "price" }) ?? "";
  const compareText = useWatch({ control, name: "compareAtPrice" }) ?? "";

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Check the URL handle is free while typing (debounced; stale answers are ignored below).
  const productId = product?.id ?? null;
  const savedSlug = product?.slug ?? null;
  useEffect(() => {
    if (!SLUG_PATTERN.test(slug) || slug === savedSlug) return;
    const timer = window.setTimeout(async () => {
      const res = await checkProductSlugAction(slug, productId);
      if (res.ok) setSlugCheck({ slug, ...res.data });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [slug, savedSlug, productId]);

  const slugState: "current" | "checking" | "available" | "taken" | null = !SLUG_PATTERN.test(slug)
    ? null
    : slug === savedSlug
      ? "current"
      : slugCheck?.slug !== slug
        ? "checking"
        : slugCheck.available
          ? "available"
          : "taken";

  const price = Number(priceText.replace(/[,\s]/g, ""));
  const compare = Number(compareText.replace(/[,\s]/g, ""));
  const off = Number.isFinite(price) && Number.isFinite(compare) && compareText.trim() ? discountPercent(price, compare) : 0;
  const errorCount = Object.keys(errors).length;

  const onSubmit = handleSubmit(
    async () => {
      setServerError(null);
      const res = await saveProductAction(getValues(), productId);
      if (!res.ok) {
        setServerError(res.error);
        const entries = Object.entries(res.fieldErrors ?? {}).filter(([, messages]) => messages?.length);
        entries.forEach(([path, messages], i) =>
          setError(path as FieldPath<ProductFormInput>, { type: "server", message: messages![0] }, { shouldFocus: i === 0 }),
        );
        toast({ tone: "error", message: res.error });
        return;
      }
      toast({ message: res.message ?? "Saved." });
      if (!product) {
        // Leave the new-product page without the unsaved-changes warning.
        reset(getValues());
        router.replace(`/admin/products/${res.data.id}`);
      } else {
        router.refresh();
      }
    },
    () => setServerError(null),
  );

  const regenerateSlug = () => {
    setValue("slug", slugify(getValues("name")), { shouldDirty: true, shouldValidate: true });
    setSlugEdited(false);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate aria-label={product ? `Edit ${product.name}` : "New product"} className="pb-28">
        {serverError && (
          <div role="alert" className="mb-6 rounded-[3px] border border-[#e8cfc8] bg-blush px-5 py-4 text-[14px] text-sale">
            {serverError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <Panel title="Product details">
              <div className="space-y-5">
                <Input
                  label="Name"
                  required
                  maxLength={160}
                  error={errors.name?.message}
                  {...register("name", {
                    onChange: (e) => {
                      if (!slugEdited) setValue("slug", slugify(e.target.value), { shouldDirty: true, shouldValidate: submitCount > 0 });
                    },
                  })}
                />
                <div>
                  <Input
                    label="URL handle"
                    required
                    maxLength={120}
                    autoCapitalize="none"
                    spellCheck={false}
                    error={errors.slug?.message}
                    hint={
                      product
                        ? "Changing the handle changes the product’s web address; old links will stop working."
                        : "Filled in from the name. Lowercase letters, numbers and hyphens."
                    }
                    {...register("slug", { onChange: () => setSlugEdited(true) })}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
                    <p aria-live="polite" className="flex items-center gap-1.5">
                      {slug && SLUG_PATTERN.test(slug) && <span className="text-ink-3">/product/{slug}</span>}
                      {slugState === "checking" && (
                        <span className="inline-flex items-center gap-1 text-ink-3">
                          <Loader2 aria-hidden className="size-3.5 animate-spin" /> Checking…
                        </span>
                      )}
                      {slugState === "available" && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Check aria-hidden className="size-3.5" /> Available
                        </span>
                      )}
                      {slugState === "taken" && <span className="text-sale">· Already used by “{slugCheck?.usedBy}”</span>}
                    </p>
                    {slugEdited && (
                      <button type="button" onClick={regenerateSlug} className="inline-flex items-center gap-1.5 font-ui text-ink-2 underline underline-offset-4 hover:text-charcoal">
                        <RefreshCw aria-hidden className="size-3.5" strokeWidth={1.6} />
                        Use the name
                      </button>
                    )}
                  </div>
                </div>
                <Textarea
                  label="Short description"
                  maxLength={300}
                  rows={2}
                  className="min-h-20"
                  hint="One line for listings and search results (300 characters max)."
                  error={errors.shortDescription?.message}
                  {...register("shortDescription")}
                />
                <Textarea
                  label="Description"
                  maxLength={5000}
                  rows={8}
                  hint="Plain text. Leave a blank line between paragraphs."
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>
            </Panel>

            <Panel title="Media" description="The first image is the main photo in listings; use the arrows to reorder.">
              <ImagesEditor library={options.imageLibrary} uploadsEnabled={options.uploadsEnabled} />
            </Panel>

            <Panel title="Pricing">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Price (PKR)" required inputMode="decimal" placeholder="e.g. 12950" error={errors.price?.message} {...register("price")} />
                <Input
                  label="Compare-at price (PKR)"
                  inputMode="decimal"
                  placeholder="Optional"
                  error={errors.compareAtPrice?.message}
                  hint={off > 0 ? `Shows as on sale: ${formatPrice(compare)} → ${formatPrice(price)} (−${off}%).` : "The original price, shown struck through. Must be higher than the price."}
                  {...register("compareAtPrice")}
                />
              </div>
            </Panel>

            <Panel title="Variants & inventory" description="Sizes and colours, each with its own SKU and stock. Leave the price override empty to use the product price.">
              <VariantsEditor />
            </Panel>

            <Panel title="Specifications">
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Textarea label="Material" rows={2} className="min-h-20" maxLength={300} error={errors.material?.message} {...register("material")} />
                  <Textarea label="Care instructions" rows={2} className="min-h-20" maxLength={1000} error={errors.careInstructions?.message} {...register("careInstructions")} />
                </div>
                <fieldset>
                  <legend className="mb-3 font-ui text-[13px] font-medium tracking-[0.04em] text-charcoal">Details</legend>
                  <DetailsEditor />
                </fieldset>
              </div>
            </Panel>
          </div>

          <div className="min-w-0 space-y-6">
            <Panel title="Status">
              <fieldset>
                <legend className="sr-only">Status</legend>
                <div className="space-y-2.5">
                  {PRODUCT_STATUSES.map((s) => (
                    <label
                      key={s}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-[3px] border px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                        status === s ? "border-charcoal bg-white" : "border-line hover:border-line-strong",
                      )}
                    >
                      <input type="radio" value={s} className="mt-1 size-4 accent-charcoal" {...register("status")} />
                      <span>
                        <span className="block font-ui text-[14px] font-medium">{STATUS_LABELS[s]}</span>
                        <span className="block text-[13px] leading-snug text-ink-3">{STATUS_HINTS[s]}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.status?.message && (
                  <p role="alert" className="mt-2 text-[13px] text-sale">
                    {errors.status.message}
                  </p>
                )}
              </fieldset>
              <div className="mt-5 border-t border-line pt-5">
                <Checkbox label="Featured — shown first under “Featured” sorting" {...register("featured")} />
              </div>
              {product?.status === "active" && (
                <a
                  href={`/product/${product.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="mt-5 inline-flex items-center gap-2 font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal"
                >
                  View in the store
                  <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.5} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </Panel>

            <Panel title="Organisation">
              <div className="space-y-5">
                <Select label="Category" required error={errors.categoryId?.message} {...register("categoryId")}>
                  <option value="">Choose a category</option>
                  <CategoryOptions categories={options.categories} />
                </Select>
                <Input
                  label="Product SKU"
                  required
                  maxLength={64}
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="uppercase"
                  placeholder="e.g. AQ-LUX-101"
                  hint="Unique code for the product. Saved in capitals."
                  error={errors.sku?.message}
                  {...register("sku")}
                />
                <fieldset aria-describedby={errors.collectionIds ? "collections-error" : undefined}>
                  <legend className="mb-3 font-ui text-[13px] font-medium tracking-[0.04em] text-charcoal">Collections</legend>
                  {options.collections.length === 0 ? (
                    <p className="text-[13px] text-ink-3">No collections yet.</p>
                  ) : (
                    <Controller
                      control={control}
                      name="collectionIds"
                      render={({ field }) => (
                        <div className="space-y-2.5">
                          {options.collections.map((c) => {
                            const ids = field.value ?? [];
                            return (
                              <Checkbox
                                key={c.id}
                                name={field.name}
                                value={c.id}
                                checked={ids.includes(c.id)}
                                onBlur={field.onBlur}
                                onChange={(e) => field.onChange(e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id))}
                                label={`${c.name}${c.isActive ? "" : " (hidden)"}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    />
                  )}
                  {errors.collectionIds?.message && (
                    <p id="collections-error" role="alert" className="mt-2 text-[13px] text-sale">
                      {errors.collectionIds.message}
                    </p>
                  )}
                </fieldset>
              </div>
            </Panel>

            {product && (
              <Panel title="Performance">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-[14px]">
                  <div>
                    <dt className="text-[12px] text-ink-3">Units sold</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{product.salesCount.toLocaleString("en-US")}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-ink-3">Orders</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">
                      {product.orderCount.toLocaleString("en-US")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-ink-3">Rating</dt>
                    <dd className="mt-0.5 font-medium">
                      {product.ratingCount ? `${product.ratingAvg.toFixed(1)} / 5 (${product.ratingCount})` : "No reviews"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-ink-3">Created</dt>
                    <dd className="mt-0.5">{formatDateTime(product.createdAt)}</dd>
                  </div>
                  {product.updatedAt && (
                    <div className="col-span-2">
                      <dt className="text-[12px] text-ink-3">Last updated</dt>
                      <dd className="mt-0.5">{formatDateTime(product.updatedAt)}</dd>
                    </div>
                  )}
                </dl>
              </Panel>
            )}

            {product && <DangerZone product={product} dirty={isDirty} />}
          </div>
        </div>

        <div className="sticky bottom-0 z-20 -mx-5 mt-8 border-t border-line bg-ivory/95 px-5 py-3.5 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className={cn("text-[13px]", errorCount > 0 ? "text-sale" : "text-ink-2")}>
              {isSubmitting
                ? "Saving…"
                : errorCount > 0
                  ? `Please fix ${errorCount === 1 ? "the highlighted field" : "the highlighted fields"} before saving.`
                  : isDirty
                    ? "You have unsaved changes."
                    : product
                      ? "All changes saved."
                      : "Fill in the details, then create the product."}
            </p>
            <div className="flex gap-3">
              {product ? (
                <Button size="sm" variant="secondary" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
                  Discard
                </Button>
              ) : (
                <Link href="/admin/products" className="inline-flex h-10 items-center px-3 font-ui text-[13px] text-ink-2 underline underline-offset-4 hover:text-charcoal">
                  Cancel
                </Link>
              )}
              <Button type="submit" size="sm" loading={isSubmitting} disabled={Boolean(product) && !isDirty}>
                {product ? "Save product" : "Create product"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
