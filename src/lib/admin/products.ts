import "server-only";
import { randomUUID } from "node:crypto";
import type { PostgrestError } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin/auth";
import {
  demoAdminDeleteProduct,
  demoAdminFormOptions,
  demoAdminGetProduct,
  demoAdminListProducts,
  demoAdminSaveProduct,
  demoAdminSetFeatured,
  demoAdminSetStatus,
  demoImageLibrary,
  demoSlugOwner,
} from "@/lib/demo/admin-products";
import { DEMO_MODE } from "@/lib/demo/mode";
import { supabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  countProducts,
  IMAGE_UPLOAD,
  matchesStock,
  paginate,
  sortProductRows,
  STOCK_SORTS,
  variantName,
  type AdminProductDetail,
  type AdminProductList,
  type AdminProductQuery,
  type AdminProductRow,
  type ProductFormOptions,
  type ProductSort,
  type ProductStatus,
} from "@/features/admin/products/model";
import type { ProductFormOutput } from "@/features/admin/products/schema";
import type { Json } from "@/types/database";

/*
 * Products admin data layer. Pages call requireAdminPage() and actions call
 * requireAdminAction() before anything here, and every export checks admin
 * access again (getAdminUser() is cached per request).
 *
 * Supabase: queries run as the signed-in admin (createSupabaseServerClient),
 * so row-level security (public.is_admin()) is enforced by the database too.
 * Saving writes the product, then its variants, images and collections; if a
 * later write fails, the earlier ones are undone so the catalogue never keeps
 * a half-saved product.
 *
 * Demo: see src/lib/demo/admin-products.ts.
 */

export type FieldErrors = Record<string, string[]>;
export type SaveProductResult =
  | { ok: true; id: string; slug: string; previousSlug: string | null }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/** Max products read when a stock filter/sort needs every row's stock. */
const STOCK_SCAN_LIMIT = 5000;
const BATCH = 1000;

const BUCKET = "product-images";

async function assertAdmin(): Promise<void> {
  if (!(await getAdminUser())) throw new Error("FORBIDDEN");
}

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** Public URL prefix of this project's product-images bucket. */
const bucketPrefix = () => `${supabaseConfig().url.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;
const UPLOAD_PATH = /^products\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

/** Storage path of an image uploaded through the admin, or null for any other URL. */
function uploadedPath(url: string): string | null {
  if (DEMO_MODE) return null;
  const prefix = bucketPrefix();
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return UPLOAD_PATH.test(path) ? path : null;
}

/** Images a product may use: the bundled library or this store's uploads. */
const isAllowedImage = (url: string) => demoImageLibrary().includes(url) || uploadedPath(url) !== null;

/** Detects the real image type from the file's first bytes (never trusts the browser's MIME type). */
function sniffImage(bytes: Uint8Array): { type: string; ext: string } | null {
  const at = (i: number, ...values: number[]) => values.every((v, j) => bytes[i + j] === v);
  const ascii = (i: number, s: string) => at(i, ...[...s].map((c) => c.charCodeAt(0)));
  if (at(0, 0xff, 0xd8, 0xff)) return { type: "image/jpeg", ext: "jpg" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { type: "image/png", ext: "png" };
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return { type: "image/webp", ext: "webp" };
  if (ascii(4, "ftyp") && (ascii(8, "avif") || ascii(8, "avis"))) return { type: "image/avif", ext: "avif" };
  return null;
}

/** Uploads a product photo to Supabase Storage and returns its public URL. */
export async function uploadProductImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await assertAdmin();
  if (DEMO_MODE) return { ok: false, error: "Uploads need Supabase Storage. Choose a photo from the library instead." };
  if (file.size === 0) return { ok: false, error: "This file is empty." };
  if (file.size > IMAGE_UPLOAD.maxBytes) return { ok: false, error: "Images must be 10 MB or smaller." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: "Upload a JPEG, PNG, WebP or AVIF image." };

  const path = `products/${randomUUID()}.${kind.ext}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: kind.type, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, error: "The upload failed. Please try again." };
  return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Removes uploaded files that no product image row references any more (best effort). */
async function removeUnusedUploads(supabase: Supabase, urls: string[]): Promise<void> {
  const candidates = [...new Set(urls)].flatMap((url) => {
    const path = uploadedPath(url);
    return path ? [{ url, path }] : [];
  });
  if (!candidates.length) return;
  const { data, error } = await supabase
    .from("product_images")
    .select("url")
    .in(
      "url",
      candidates.map((c) => c.url),
    );
  if (error) return;
  const used = new Set(data.map((r) => r.url));
  const paths = candidates.filter((c) => !used.has(c.url)).map((c) => c.path);
  if (paths.length) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) console.error("Could not remove unused product images", removeError.message);
  }
}

/** Deletes an upload that was removed from the editor before saving (only if nothing uses it). */
export async function discardProductUpload(url: string): Promise<void> {
  await assertAdmin();
  if (DEMO_MODE || !uploadedPath(url)) return;
  await removeUnusedUploads(await createSupabaseServerClient(), [url]);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

type ListRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  status: ProductStatus;
  featured: boolean;
  stock_quantity: number;
  sales_count: number;
  created_at: string;
  category_id: string | null;
  images: { url: string; alt_text: string | null; position: number }[];
  variants: { stock_quantity: number }[];
};

const LIST_SELECT =
  "id, name, slug, sku, price, compare_at_price, status, featured, stock_quantity, sales_count, created_at, category_id, images:product_images ( url, alt_text, position ), variants:product_variants ( stock_quantity )";

type CategoryRow = { id: string; name: string; parent_id: string | null; position: number; is_active: boolean };

async function loadCategories(supabase: Supabase): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from("categories").select("id, name, parent_id, position, is_active").order("position");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data;
}

function toRow(r: ListRow, categories: Map<string, CategoryRow>): AdminProductRow {
  const image = [...r.images].sort((a, b) => a.position - b.position)[0];
  const category = r.category_id ? categories.get(r.category_id) : undefined;
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    sku: r.sku,
    price: Number(r.price),
    compareAtPrice: r.compare_at_price === null ? null : Number(r.compare_at_price),
    status: r.status,
    featured: r.featured,
    stock: r.variants.length ? r.variants.reduce((n, v) => n + v.stock_quantity, 0) : r.stock_quantity,
    variantCount: r.variants.length,
    soldOutVariants: r.variants.filter((v) => v.stock_quantity <= 0).length,
    salesCount: r.sales_count,
    createdAt: r.created_at,
    category: category ? { id: category.id, name: category.name } : null,
    image: image ? { url: image.url, alt: image.alt_text ?? r.name } : null,
  };
}

const SORT_COLUMNS: Record<Exclude<ProductSort, "stock_asc" | "stock_desc">, [column: string, ascending: boolean]> = {
  newest: ["created_at", false],
  oldest: ["created_at", true],
  name_asc: ["name", true],
  name_desc: ["name", false],
  price_asc: ["price", true],
  price_desc: ["price", false],
  best_selling: ["sales_count", false],
};

/** Search text safe to embed in a PostgREST or() filter: letters, numbers, spaces, apostrophes and hyphens. */
const searchTerm = (q: string) => q.replace(/[^\p{L}\p{N}\s'’-]/gu, " ").replace(/\s+/g, " ").trim();

async function listFromSupabase(query: AdminProductQuery): Promise<AdminProductList> {
  const supabase = await createSupabaseServerClient();
  const categories = await loadCategories(supabase);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // The category and its descendants.
  let categoryIds: string[] | null = null;
  if (query.category) {
    const ids = [query.category];
    for (let i = 0; i < ids.length; i++) for (const c of categories) if (c.parent_id === ids[i] && !ids.includes(c.id)) ids.push(c.id);
    categoryIds = ids;
  }

  // Products whose name, SKU or a variant SKU contains the term.
  const term = searchTerm(query.q);
  let variantMatches: string[] = [];
  if (term) {
    const { data, error } = await supabase.from("product_variants").select("product_id").ilike("sku", `%${term}%`).limit(100);
    if (error) throw new Error(`Product search failed: ${error.message}`);
    variantMatches = [...new Set(data.map((v) => v.product_id))];
  }

  const filtered = (count?: "exact") => {
    let q = supabase.from("products").select(LIST_SELECT, count ? { count } : undefined);
    if (query.status) q = q.eq("status", query.status);
    if (categoryIds) q = q.in("category_id", categoryIds);
    if (term) {
      const pattern = `"%${term}%"`;
      q = q.or([`name.ilike.${pattern}`, `sku.ilike.${pattern}`, ...(variantMatches.length ? [`id.in.(${variantMatches.join(",")})`] : [])].join(","));
    }
    return q;
  };

  const countsPromise = inventoryCounts(supabase);

  if (!query.stock && !STOCK_SORTS.includes(query.sort)) {
    // The database sorts and pages.
    const [column, ascending] = SORT_COLUMNS[query.sort as keyof typeof SORT_COLUMNS];
    const fetchPage = async (page: number) => {
      const from = (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE;
      const { data, error, count } = await filtered("exact")
        .order(column, { ascending })
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, from + ADMIN_PRODUCTS_PAGE_SIZE - 1)
        .overrideTypes<ListRow[], { merge: false }>();
      if (error) throw new Error(`Failed to load products: ${error.message}`);
      return { data, total: count ?? 0 };
    };
    let page = query.page;
    let result = await fetchPage(page);
    const pageCount = Math.max(1, Math.ceil(result.total / ADMIN_PRODUCTS_PAGE_SIZE));
    if (page > pageCount) {
      page = pageCount;
      result = await fetchPage(page);
    }
    return {
      rows: result.data.map((r) => toRow(r, categoryById)),
      total: result.total,
      page,
      pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
      pageCount,
      counts: await countsPromise,
      truncated: false,
    };
  }

  // Stock filters and sorts need every matching row's stock.
  const rows: ListRow[] = [];
  for (let from = 0; from < STOCK_SCAN_LIMIT; from += BATCH) {
    const { data, error } = await filtered()
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + BATCH - 1)
      .overrideTypes<ListRow[], { merge: false }>();
    if (error) throw new Error(`Failed to load products: ${error.message}`);
    rows.push(...data);
    if (data.length < BATCH) break;
  }
  const matching = rows.map((r) => toRow(r, categoryById)).filter((r) => matchesStock(r, query.stock));
  return {
    ...paginate(sortProductRows(matching, query.sort), query.page),
    counts: await countsPromise,
    truncated: rows.length >= STOCK_SCAN_LIMIT,
  };
}

/** Status and stock counts across the whole catalogue. */
async function inventoryCounts(supabase: Supabase) {
  const rows: { status: ProductStatus; stock: number }[] = [];
  for (let from = 0; from < STOCK_SCAN_LIMIT; from += BATCH) {
    const { data, error } = await supabase
      .from("products")
      .select("status, stock_quantity, variants:product_variants ( stock_quantity )")
      .order("id")
      .range(from, from + BATCH - 1)
      .overrideTypes<{ status: ProductStatus; stock_quantity: number; variants: { stock_quantity: number }[] }[], { merge: false }>();
    if (error) throw new Error(`Failed to count products: ${error.message}`);
    for (const r of data) {
      rows.push({ status: r.status, stock: r.variants.length ? r.variants.reduce((n, v) => n + v.stock_quantity, 0) : r.stock_quantity });
    }
    if (data.length < BATCH) break;
  }
  return countProducts(rows);
}

export async function listAdminProducts(query: AdminProductQuery): Promise<AdminProductList> {
  await assertAdmin();
  return DEMO_MODE ? demoAdminListProducts(query) : listFromSupabase(query);
}

type DetailRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: ProductStatus;
  featured: boolean;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  material: string | null;
  care_instructions: string | null;
  details: unknown;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  sales_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  variants: VariantRow[];
  images: ImageRow[];
  product_collections: { collection_id: string; position: number }[];
};

type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price: number | null;
  stock_quantity: number;
  position: number;
  created_at: string;
};

type ImageRow = { id: string; product_id: string; url: string; alt_text: string | null; position: number; created_at: string };

const DETAIL_SELECT = `
  id, name, slug, sku, status, featured, category_id, short_description, description, material, care_instructions,
  details, price, compare_at_price, stock_quantity, sales_count, rating_avg, rating_count, created_at, updated_at,
  variants:product_variants ( id, product_id, name, sku, size, color, color_hex, price, stock_quantity, position, created_at ),
  images:product_images ( id, product_id, url, alt_text, position, created_at ),
  product_collections ( collection_id, position )
`;

async function loadDetailRow(supabase: Supabase, id: string): Promise<DetailRow | null> {
  const { data, error } = await supabase.from("products").select(DETAIL_SELECT).eq("id", id).maybeSingle().overrideTypes<DetailRow, { merge: false }>();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data;
}

/** Distinct orders that include the product (order items keep a snapshot of it). */
async function orderCountFor(supabase: Supabase, productId: string): Promise<number> {
  const { data, error } = await supabase.from("order_items").select("order_id").eq("product_id", productId).limit(1000);
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return new Set(data.map((r) => r.order_id)).size;
}

const ordersBlockReason = (orderCount: number) =>
  orderCount > 0 ? `It appears on ${orderCount === 1 ? "an order" : `${orderCount} orders`}. Archive it instead to take it off the store.` : null;

const toDetails = (value: unknown): { label: string; value: string }[] =>
  Array.isArray(value)
    ? value.flatMap((d) =>
        d && typeof d === "object" && typeof d.label === "string" && typeof d.value === "string" ? [{ label: d.label, value: d.value }] : [],
      )
    : [];

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminGetProduct(id);
  const supabase = await createSupabaseServerClient();
  const [p, orderCount] = await Promise.all([loadDetailRow(supabase, id), orderCountFor(supabase, id)]);
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    status: p.status,
    featured: p.featured,
    categoryId: p.category_id,
    collectionIds: [...p.product_collections].sort((a, b) => a.position - b.position).map((c) => c.collection_id),
    shortDescription: p.short_description,
    description: p.description,
    material: p.material,
    careInstructions: p.care_instructions,
    details: toDetails(p.details),
    price: Number(p.price),
    compareAtPrice: p.compare_at_price === null ? null : Number(p.compare_at_price),
    stock: p.stock_quantity,
    variants: [...p.variants]
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex,
        sku: v.sku,
        price: v.price === null ? null : Number(v.price),
        stock: v.stock_quantity,
      })),
    images: [...p.images].sort((a, b) => a.position - b.position).map((i) => ({ id: i.id, url: i.url, alt: i.alt_text ?? "" })),
    salesCount: p.sales_count,
    ratingAvg: Number(p.rating_avg),
    ratingCount: p.rating_count,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    orderCount,
    deleteBlockedReason: ordersBlockReason(orderCount),
  };
}

export async function getProductFormOptions(): Promise<ProductFormOptions> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminFormOptions();
  const supabase = await createSupabaseServerClient();
  const [categories, collections] = await Promise.all([
    loadCategories(supabase),
    supabase.from("collections").select("id, name, position, is_active").order("position"),
  ]);
  if (collections.error) throw new Error(`Failed to load collections: ${collections.error.message}`);
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id, isActive: c.is_active })),
    collections: collections.data.map((c) => ({ id: c.id, name: c.name, isActive: c.is_active })),
    imageLibrary: demoImageLibrary(),
    uploadsEnabled: true,
  };
}

/** The product already using a slug (other than `excludeId`), if any. */
export async function findSlugOwner(slug: string, excludeId: string | null): Promise<{ id: string; name: string } | null> {
  await assertAdmin();
  if (DEMO_MODE) return demoSlugOwner(slug, excludeId);
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("products").select("id, name").eq("slug", slug);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw new Error(`Failed to check the URL handle: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Saving (Supabase)
// ---------------------------------------------------------------------------

/** A failed write, carrying the database error for mapping to a message. */
class WriteError extends Error {
  constructor(readonly db: PostgrestError) {
    super(db.message);
  }
}

/** Awaits a query and throws a WriteError if it failed. Only read the result of queries that select rows. */
async function run<T>(request: PromiseLike<{ data: T | null; error: PostgrestError | null }>): Promise<NonNullable<T>> {
  const { data, error } = await request;
  if (error) throw new WriteError(error);
  return data as NonNullable<T>;
}

/** Runs `fn` over `items` a few at a time. */
async function inChunks<T>(items: T[], fn: (item: T) => Promise<unknown>, size = 8): Promise<void> {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

/** Friendly message (and field) for a database error. */
function describeDbError(error: PostgrestError): { error: string; fieldErrors?: FieldErrors } {
  const text = `${error.message} ${error.details ?? ""}`;
  if (error.code === "23505") {
    if (text.includes("products_slug_key")) return { error: "Please check the highlighted fields.", fieldErrors: { slug: ["This URL handle is already in use"] } };
    if (text.includes("products_sku_key")) return { error: "Please check the highlighted fields.", fieldErrors: { sku: ["This SKU is already in use"] } };
    if (text.includes("product_variants_sku_key")) return { error: "A variant SKU is already used by another product." };
    if (text.includes("product_variants_option_key")) return { error: "Two variants have the same size and colour." };
    return { error: "Something with the same value already exists." };
  }
  if (error.code === "23514" && text.includes("products_compare_gt_price")) {
    return { error: "Please check the highlighted fields.", fieldErrors: { compareAtPrice: ["Compare-at price must be higher than the price"] } };
  }
  if (error.code === "42501") return { error: "Your account isn’t allowed to change products." };
  return { error: "We couldn’t save this product. Nothing was changed — please try again." };
}

const add = (errors: FieldErrors, path: string, message: string) => void (errors[path] ??= []).push(message);

/** Checks that need the database. Returns field errors (empty when valid). */
async function checkRefs(supabase: Supabase, input: ProductFormOutput, current: DetailRow | null): Promise<FieldErrors> {
  const errors: FieldErrors = {};
  const id = current?.id ?? null;
  const variantSkus = input.variants.map((v) => v.sku);

  const notSelf = <Q extends { neq: (column: string, value: string) => Q }>(q: Q) => (id ? q.neq("id", id) : q);
  const [slug, sku, category, collections, variants] = await Promise.all([
    notSelf(supabase.from("products").select("id, name").eq("slug", input.slug)).limit(1),
    notSelf(supabase.from("products").select("id, name").eq("sku", input.sku)).limit(1),
    supabase.from("categories").select("id").eq("id", input.categoryId).limit(1),
    input.collectionIds.length ? supabase.from("collections").select("id").in("id", input.collectionIds) : Promise.resolve({ data: [], error: null }),
    variantSkus.length
      ? supabase.from("product_variants").select("sku, product_id, product:products ( name )").in("sku", variantSkus)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = [slug, sku, category, collections, variants].find((r) => r.error);
  if (failed?.error) throw new Error(`Failed to check the product: ${failed.error.message}`);

  if (slug.data?.length) add(errors, "slug", `Already used by “${slug.data[0].name}”`);
  if (sku.data?.length) add(errors, "sku", `Already used by “${sku.data[0].name}”`);
  if (!category.data?.length) add(errors, "categoryId", "Choose a category from the list");
  if ((collections.data?.length ?? 0) !== input.collectionIds.length) add(errors, "collectionIds", "One of the collections no longer exists");

  const takenSkus = new Map(
    ((variants.data ?? []) as unknown as { sku: string; product_id: string; product: { name: string } | null }[])
      .filter((v) => v.product_id !== id)
      .map((v) => [v.sku, v.product?.name ?? "another product"]),
  );
  const ownVariantIds = new Set(current?.variants.map((v) => v.id));
  input.variants.forEach((v, i) => {
    if (v.id && !ownVariantIds.has(v.id)) add(errors, `variants.${i}.sku`, "This variant no longer exists. Reload the page and try again.");
    const owner = takenSkus.get(v.sku);
    if (owner) add(errors, `variants.${i}.sku`, `Already used by “${owner}”`);
  });

  const ownImages = new Map(current?.images.map((img) => [img.id, img.url]));
  const ownUrls = new Set(ownImages.values());
  input.images.forEach((img, i) => {
    if (img.id && ownImages.get(img.id) !== img.url) add(errors, `images.${i}.url`, "This image no longer exists. Reload the page and try again.");
    else if (!ownUrls.has(img.url) && !isAllowedImage(img.url)) add(errors, `images.${i}.url`, "Upload this image or choose it from the library");
  });

  return errors;
}

function productRow(input: ProductFormOutput) {
  return {
    category_id: input.categoryId,
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    short_description: input.shortDescription,
    description: input.description,
    material: input.material,
    care_instructions: input.careInstructions,
    details: input.details.map(({ label, value }) => ({ label, value })) as NonNullable<Json>,
    price: input.price,
    compare_at_price: input.compareAtPrice,
    status: input.status,
    featured: input.featured,
    // Stock lives on variants when there are any.
    stock_quantity: input.variants.length ? 0 : input.stock,
  };
}

type VariantFields = Pick<VariantRow, "name" | "sku" | "size" | "color" | "color_hex" | "price" | "stock_quantity" | "position">;

function variantFields(v: ProductFormOutput["variants"][number], position: number): VariantFields {
  return {
    name: variantName(v.color, v.size),
    sku: v.sku,
    size: v.size,
    color: v.color,
    color_hex: v.colorHex,
    price: v.price,
    stock_quantity: v.stock,
    position,
  };
}

const pickVariantFields = (v: VariantRow): VariantFields => ({
  name: v.name,
  sku: v.sku,
  size: v.size,
  color: v.color,
  color_hex: v.color_hex,
  price: v.price,
  stock_quantity: v.stock_quantity,
  position: v.position,
});

const sameVariant = (a: VariantFields, b: VariantFields) =>
  a.name === b.name &&
  a.sku === b.sku &&
  a.size === b.size &&
  a.color === b.color &&
  a.color_hex === b.color_hex &&
  (a.price === null ? b.price === null : b.price !== null && Number(a.price) === Number(b.price)) &&
  a.stock_quantity === b.stock_quantity &&
  a.position === b.position;

/** True when the SKU or the size/colour pair changes (both are unique keys). */
const movesKey = (a: VariantFields, b: VariantFields) => a.sku !== b.sku || a.size !== b.size || a.color !== b.color;

/**
 * Updates variants in two phases so swapped SKUs or options never collide
 * with each other's unique keys: rows whose keys change first move to unique
 * placeholder keys, then every row gets its final values.
 */
async function updateVariants(supabase: Supabase, changes: { id: string; from: VariantFields; to: VariantFields }[]): Promise<void> {
  const moving = changes.filter((c) => movesKey(c.from, c.to));
  await inChunks(moving, (c) =>
    run(supabase.from("product_variants").update({ sku: `TMP-${randomUUID()}`, size: null, color: `~${randomUUID().slice(0, 18)}` }).eq("id", c.id)),
  );
  await inChunks(changes, (c) => run(supabase.from("product_variants").update(c.to).eq("id", c.id)));
}

/** Next free positions at the end of each collection. */
async function collectionEnds(supabase: Supabase, collectionIds: string[]): Promise<Map<string, number>> {
  const ends = new Map<string, number>();
  await Promise.all(
    collectionIds.map(async (collectionId) => {
      const data = await run(
        supabase.from("product_collections").select("position").eq("collection_id", collectionId).order("position", { ascending: false }).limit(1),
      );
      ends.set(collectionId, (data[0]?.position ?? -1) + 1);
    }),
  );
  return ends;
}

async function createInSupabase(supabase: Supabase, input: ProductFormOutput): Promise<SaveProductResult> {
  const { data: created, error: createError } = await supabase.from("products").insert(productRow(input)).select("id").single();
  if (createError) return { ok: false, ...describeDbError(createError) };
  const productId = created.id;

  try {
    if (input.variants.length) {
      await run(supabase.from("product_variants").insert(input.variants.map((v, i) => ({ product_id: productId, ...variantFields(v, i) }))));
    }
    if (input.images.length) {
      await run(supabase.from("product_images").insert(input.images.map((img, i) => ({ product_id: productId, url: img.url, alt_text: img.alt, position: i }))));
    }
    if (input.collectionIds.length) {
      const ends = await collectionEnds(supabase, input.collectionIds);
      await run(
        supabase
          .from("product_collections")
          .insert(input.collectionIds.map((collectionId) => ({ product_id: productId, collection_id: collectionId, position: ends.get(collectionId) ?? 0 }))),
      );
    }
  } catch (e) {
    // Deleting the product cascades to anything already written for it.
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) console.error("Could not roll back a half-created product", productId, error.message);
    if (e instanceof WriteError) return { ok: false, ...describeDbError(e.db) };
    throw e;
  }
  return { ok: true, id: productId, slug: input.slug, previousSlug: null };
}

async function updateInSupabase(supabase: Supabase, input: ProductFormOutput, current: DetailRow): Promise<SaveProductResult> {
  const id = current.id;
  const undo: (() => Promise<unknown>)[] = [];

  // Variants
  const currentVariants = new Map(current.variants.map((v) => [v.id, v]));
  const keptIds = new Set(input.variants.flatMap((v) => (v.id ? [v.id] : [])));
  const removedVariants = current.variants.filter((v) => !keptIds.has(v.id));
  const changedVariants = input.variants.flatMap((v, i) => {
    const before = v.id ? currentVariants.get(v.id) : undefined;
    if (!before) return [];
    const to = variantFields(v, i);
    const from = pickVariantFields(before);
    return sameVariant(from, to) ? [] : [{ id: before.id, from, to }];
  });
  const newVariants = input.variants.flatMap((v, i) => (v.id ? [] : [{ product_id: id, ...variantFields(v, i) }]));

  // Images
  const currentImages = new Map(current.images.map((img) => [img.id, img]));
  const keptImageIds = new Set(input.images.flatMap((img) => (img.id ? [img.id] : [])));
  const removedImages = current.images.filter((img) => !keptImageIds.has(img.id));
  const changedImages = input.images.flatMap((img, i) => {
    const before = img.id ? currentImages.get(img.id) : undefined;
    return before && (before.alt_text !== img.alt || before.position !== i) ? [{ before, alt_text: img.alt, position: i }] : [];
  });
  const newImages = input.images.flatMap((img, i) => (img.id ? [] : [{ product_id: id, url: img.url, alt_text: img.alt, position: i }]));

  // Collections
  const currentCollections = new Map(current.product_collections.map((pc) => [pc.collection_id, pc.position]));
  const addedCollections = input.collectionIds.filter((c) => !currentCollections.has(c));
  const removedCollections = current.product_collections.filter((pc) => !input.collectionIds.includes(pc.collection_id));

  try {
    // 1. The product itself.
    const before = {
      category_id: current.category_id,
      name: current.name,
      slug: current.slug,
      sku: current.sku,
      short_description: current.short_description,
      description: current.description,
      material: current.material,
      care_instructions: current.care_instructions,
      details: (current.details ?? []) as NonNullable<Json>,
      price: current.price,
      compare_at_price: current.compare_at_price,
      status: current.status,
      featured: current.featured,
      stock_quantity: current.stock_quantity,
    };
    await run(supabase.from("products").update(productRow(input)).eq("id", id));
    undo.push(() => run(supabase.from("products").update(before).eq("id", id)));

    // 2. Variants: removed first (freeing their SKUs and options), then changed, then new.
    if (removedVariants.length) {
      await run(
        supabase.from("product_variants").delete().in(
          "id",
          removedVariants.map((v) => v.id),
        ),
      );
      undo.push(() => run(supabase.from("product_variants").insert(removedVariants)));
    }
    if (changedVariants.length) {
      undo.push(() => updateVariants(supabase, changedVariants.map((c) => ({ id: c.id, from: c.to, to: c.from }))));
      await updateVariants(supabase, changedVariants);
    }
    if (newVariants.length) {
      const inserted = await run(supabase.from("product_variants").insert(newVariants).select("id"));
      undo.push(() =>
        run(
          supabase.from("product_variants").delete().in(
            "id",
            inserted.map((v) => v.id),
          ),
        ),
      );
    }

    // 3. Images: add, reorder, then remove (rows have no other references).
    if (newImages.length) {
      const inserted = await run(supabase.from("product_images").insert(newImages).select("id"));
      undo.push(() =>
        run(
          supabase.from("product_images").delete().in(
            "id",
            inserted.map((img) => img.id),
          ),
        ),
      );
    }
    if (changedImages.length) {
      undo.push(() =>
        inChunks(changedImages, (c) => run(supabase.from("product_images").update({ alt_text: c.before.alt_text, position: c.before.position }).eq("id", c.before.id))),
      );
      await inChunks(changedImages, (c) => run(supabase.from("product_images").update({ alt_text: c.alt_text, position: c.position }).eq("id", c.before.id)));
    }
    if (removedImages.length) {
      await run(
        supabase.from("product_images").delete().in(
          "id",
          removedImages.map((img) => img.id),
        ),
      );
      undo.push(() => run(supabase.from("product_images").insert(removedImages)));
    }

    // 4. Collections.
    if (addedCollections.length) {
      const ends = await collectionEnds(supabase, addedCollections);
      await run(
        supabase
          .from("product_collections")
          .insert(addedCollections.map((collectionId) => ({ product_id: id, collection_id: collectionId, position: ends.get(collectionId) ?? 0 }))),
      );
      undo.push(() => run(supabase.from("product_collections").delete().eq("product_id", id).in("collection_id", addedCollections)));
    }
    if (removedCollections.length) {
      await run(
        supabase
          .from("product_collections")
          .delete()
          .eq("product_id", id)
          .in(
            "collection_id",
            removedCollections.map((pc) => pc.collection_id),
          ),
      );
      undo.push(() => run(supabase.from("product_collections").insert(removedCollections.map((pc) => ({ product_id: id, ...pc })))));
    }
  } catch (e) {
    for (const step of undo.reverse()) {
      try {
        await step();
      } catch (undoError) {
        console.error("Could not undo part of a failed product save", id, undoError);
      }
    }
    if (e instanceof WriteError) return { ok: false, ...describeDbError(e.db) };
    throw e;
  }

  await removeUnusedUploads(
    supabase,
    removedImages.map((img) => img.url),
  );
  return { ok: true, id, slug: input.slug, previousSlug: current.slug !== input.slug ? current.slug : null };
}

/** Creates (id null) or updates a product with its variants, images and collections. Input is already schema-validated. */
export async function saveProduct(input: ProductFormOutput, id: string | null): Promise<SaveProductResult> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminSaveProduct(input, id);

  const supabase = await createSupabaseServerClient();
  const current = id ? await loadDetailRow(supabase, id) : null;
  if (id && !current) return { ok: false, error: "This product no longer exists." };

  const fieldErrors = await checkRefs(supabase, input, current);
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

  return current ? updateInSupabase(supabase, input, current) : createInSupabase(supabase, input);
}

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

/** Sets the status of the given products. Returns the slugs that changed. */
export async function setProductsStatus(ids: string[], status: ProductStatus): Promise<string[]> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminSetStatus(ids, status);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").update({ status }).in("id", ids).neq("status", status).select("slug");
  if (error) throw new Error(`Failed to update products: ${error.message}`);
  return data.map((p) => p.slug);
}

/** Features or un-features the given products. Returns the slugs that changed. */
export async function setProductsFeatured(ids: string[], featured: boolean): Promise<string[]> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminSetFeatured(ids, featured);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").update({ featured }).in("id", ids).neq("featured", featured).select("slug");
  if (error) throw new Error(`Failed to update products: ${error.message}`);
  return data.map((p) => p.slug);
}

/**
 * Deletes a product for good, only when no order includes it (order items
 * would keep their snapshot, but the history reads better with the product
 * archived). Variants, images, collection links, reviews, wishlist and bag
 * entries go with it (on delete cascade).
 */
export async function deleteProduct(id: string): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  await assertAdmin();
  if (DEMO_MODE) return demoAdminDeleteProduct(id);
  const supabase = await createSupabaseServerClient();
  const product = await loadDetailRow(supabase, id);
  if (!product) return { ok: false, error: "This product no longer exists." };
  const blocked = ordersBlockReason(await orderCountFor(supabase, id));
  if (blocked) return { ok: false, error: `“${product.name}” can’t be deleted. ${blocked}` };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    // An order placed a moment ago still protects the product.
    return { ok: false, error: error.code === "23503" ? "This product is now on an order. Archive it instead." : "We couldn’t delete this product. Please try again." };
  }
  await removeUnusedUploads(
    supabase,
    product.images.map((img) => img.url),
  );
  return { ok: true, slug: product.slug };
}
