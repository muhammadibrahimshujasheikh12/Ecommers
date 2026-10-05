import { z } from "zod";
import {
  PRODUCT_LIMITS,
  PRODUCT_SORTS,
  PRODUCT_STATUSES,
  SLUG_PATTERN,
  STOCK_LEVELS,
  type AdminProductQuery,
  type ProductSort,
} from "./model";

/*
 * Validation for the product editor. The same schema runs in the browser
 * (React Hook Form, instant feedback) and in the Server Action
 * (authoritative). Numbers are typed as text in the form and parsed here.
 * Cross-row rules that need the database (unique slug/SKUs, existing
 * category, allowed image URLs) are checked again on the server.
 */

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`);

const requiredText = (label: string, max: number) => text(label, max).min(1, `${label} is required`);

/** Optional text: "" becomes null. */
const optionalText = (label: string, max: number) => text(label, max).transform((v) => v || null);

const NUMBER = /^\d{1,9}(\.\d{1,2})?$/;
const OPTIONAL_NUMBER = /^(\d{1,9}(\.\d{1,2})?)?$/;
const cleanNumber = (v: string) => v.trim().replace(/[,\s]/g, "").replace(/^rs\.?/i, "");

const price = (label: string) =>
  z
    .string()
    .transform(cleanNumber)
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .regex(NUMBER, `Enter ${label.toLowerCase()} as a number, e.g. 12950`),
    )
    .transform(Number)
    .pipe(
      z
        .number()
        .positive(`${label} must be more than 0`)
        .max(PRODUCT_LIMITS.price, `${label} must be ${PRODUCT_LIMITS.price.toLocaleString("en-US")} or less`),
    );

/** Optional price: "" becomes null. */
const optionalPrice = (label: string) =>
  z
    .string()
    .transform(cleanNumber)
    .pipe(z.string().regex(OPTIONAL_NUMBER, `Enter ${label.toLowerCase()} as a number, or leave it empty`))
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(
      z
        .number()
        .positive(`${label} must be more than 0`)
        .max(PRODUCT_LIMITS.price, `${label} must be ${PRODUCT_LIMITS.price.toLocaleString("en-US")} or less`)
        .nullable(),
    );

const stock = z
  .string()
  .transform((v) => v.trim().replace(/[,\s]/g, ""))
  .pipe(z.string().min(1, "Enter a quantity").regex(/^\d{1,6}$/, "Use a whole number of units"))
  .transform(Number)
  .pipe(z.number().int().max(PRODUCT_LIMITS.stock, `Stock must be ${PRODUCT_LIMITS.stock.toLocaleString("en-US")} or less`));

/** SKUs are kept in capitals: letters, numbers, dots, dashes and underscores. */
const sku = (label: string) =>
  requiredText(label, 64)
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9._-]*$/, `${label} can use letters, numbers, dots, dashes and underscores`));

/** "" for a row that isn't saved yet, else its uuid. */
const rowId = z.union([z.literal(""), z.uuid()]).transform((v) => v || null);

const variantSchema = z.object({
  id: rowId,
  size: optionalText("Size", 24),
  color: optionalText("Colour", 40),
  colorHex: z
    .string()
    .trim()
    .transform((v) => (v && !v.startsWith("#") ? `#${v}` : v))
    .pipe(z.string().regex(/^(#[0-9A-Fa-f]{6})?$/, "Use a hex colour like #C9D8CC"))
    .transform((v) => (v ? v.toUpperCase() : null)),
  sku: sku("SKU"),
  price: optionalPrice("Price"),
  stock,
});

const imageSchema = z.object({
  id: rowId,
  url: z.string().trim().min(1, "Image is missing").max(1000, "Image address is too long"),
  alt: optionalText("Alt text", 200),
});

const detailSchema = z.object({
  label: requiredText("Label", 40),
  value: requiredText("Value", 300),
});

export const productFormSchema = z
  .object({
    name: requiredText("Name", 160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "URL handle is required")
      .max(120, "URL handle must be 120 characters or fewer")
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens, e.g. gul-e-nar"),
    sku: sku("Product SKU"),
    status: z.enum(PRODUCT_STATUSES, "Choose a status"),
    featured: z.boolean(),
    categoryId: z.uuid("Choose a category"),
    collectionIds: z
      .array(z.uuid())
      .max(PRODUCT_LIMITS.collections, `Choose up to ${PRODUCT_LIMITS.collections} collections`)
      .transform((ids) => [...new Set(ids)]),
    shortDescription: optionalText("Short description", 300),
    description: optionalText("Description", 5000),
    material: optionalText("Material", 300),
    careInstructions: optionalText("Care instructions", 1000),
    details: z.array(detailSchema).max(PRODUCT_LIMITS.details, `Add up to ${PRODUCT_LIMITS.details} details`),
    price: price("Price"),
    compareAtPrice: optionalPrice("Compare-at price"),
    /** Product-level stock: only used when there are no variants. */
    stock,
    variants: z.array(variantSchema).max(PRODUCT_LIMITS.variants, `Add up to ${PRODUCT_LIMITS.variants} variants`),
    images: z.array(imageSchema).max(PRODUCT_LIMITS.images, `Add up to ${PRODUCT_LIMITS.images} images`),
  })
  .superRefine((p, ctx) => {
    if (p.compareAtPrice !== null && p.compareAtPrice <= p.price) {
      ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Compare-at price must be higher than the price, or empty" });
    }

    const skus = new Map<string, number>();
    const options = new Map<string, number>();
    p.variants.forEach((v, i) => {
      if (!v.size && !v.color) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "size"], message: "Add a size or a colour" });
      }
      const seenSku = skus.get(v.sku);
      if (seenSku !== undefined) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: `Same SKU as variant ${seenSku + 1}` });
      } else skus.set(v.sku, i);

      const option = `${(v.size ?? "").toLowerCase()}|${(v.color ?? "").toLowerCase()}`;
      const seenOption = options.get(option);
      if (seenOption !== undefined) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "size"], message: `Same size and colour as variant ${seenOption + 1}` });
      } else options.set(option, i);
    });

    const urls = new Set<string>();
    p.images.forEach((img, i) => {
      if (urls.has(img.url)) ctx.addIssue({ code: "custom", path: ["images", i, "url"], message: "This image is already added" });
      urls.add(img.url);
    });
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

export const productIdSchema = z.uuid();
export const productIdsSchema = z.array(z.uuid()).min(1, "Select at least one product").max(100, "Select up to 100 products at a time");
export const productStatusSchema = z.enum(PRODUCT_STATUSES);

/** A slug to check while typing (looser than the form: any string, checked for shape here). */
export const slugCheckSchema = z.object({
  slug: z.string().trim().toLowerCase().max(120).regex(SLUG_PATTERN),
  excludeId: z.uuid().nullable(),
});

// ---------------------------------------------------------------------------
// List query (URL search params). Anything invalid falls back to a default.
// ---------------------------------------------------------------------------

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T | ""): T | "" =>
  (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

export function parseProductQuery(params: Record<string, string | string[] | undefined>): AdminProductQuery {
  // Search: printable text only, collapsed and capped.
  const q = first(params.q)
    .replace(/[^\p{L}\p{N}\s'’.\-_/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const category = z.uuid().safeParse(first(params.category)).success ? first(params.category) : "";
  const page = Number.parseInt(first(params.page), 10);
  return {
    q,
    category,
    status: pick(first(params.status), PRODUCT_STATUSES, ""),
    stock: pick(first(params.stock), STOCK_LEVELS, ""),
    sort: (pick(first(params.sort), PRODUCT_SORTS.map((s) => s.value), "newest") || "newest") as ProductSort,
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
  };
}
