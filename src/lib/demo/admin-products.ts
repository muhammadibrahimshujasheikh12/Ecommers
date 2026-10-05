import "server-only";
import { randomUUID } from "node:crypto";
import {
  countProducts,
  matchesStock,
  paginate,
  sortProductRows,
  variantName,
  type AdminProductDetail,
  type AdminProductList,
  type AdminProductQuery,
  type AdminProductRow,
  type ProductFormOptions,
  type ProductStatus,
} from "@/features/admin/products/model";
import type { ProductFormOutput } from "@/features/admin/products/schema";
import { adminLiveDemoOrders } from "./admin-orders";
import raw from "./dataset.json";
import { daysAgo, demoData, demoDb, mutateDemoData, type DemoProduct, type DemoProductCollection, type DemoVariant } from "./db";
import { demoRegistry, RUNTIME_LIMITS } from "./runtime";

/*
 * Demo-mode product admin over the in-memory catalogue. Every change goes
 * through mutateDemoData(), so it shows on the storefront for every visitor
 * until the server restarts. Callers (src/lib/admin/products.ts) have already
 * checked admin access and validated the input with productFormSchema; the
 * checks here are the ones that need the data (unique slug/SKUs, existing
 * category and collections, allowed images, variant ownership).
 *
 * The demo admin is open to anyone, so: new products are capped at
 * RUNTIME_LIMITS.products, only products created here can be deleted
 * outright (sample products can be archived, which is reversible), and
 * images come from the bundled library because there is no Storage.
 */

/** Optional fields the admin sets on product rows (absent on seeded rows). */
type ProductRow = DemoProduct & { stock_quantity?: number; created_at?: string; updated_at?: string };

type FieldErrors = Record<string, string[]>;
export type DemoSaveResult =
  | { ok: true; id: string; slug: string; previousSlug: string | null }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/** Ids of products created from the demo admin. */
const createdIds = () => demoRegistry("admin-products:created", () => new Set<string>());

let library: string[] | null = null;

/** The bundled product photos (public/images/products), as used by the seed. */
export function demoImageLibrary(): string[] {
  return (library ??= [...new Set(raw.product_images.map((i) => i.url))].sort());
}

const statusOf = (p: DemoProduct): ProductStatus => p.status ?? "active";

function stockOf(p: ProductRow): number {
  const variants = demoDb.variantsOf(p.id);
  return variants.length ? variants.reduce((n, v) => n + v.stock_quantity, 0) : (p.stock_quantity ?? 0);
}

function toRow(p: ProductRow): AdminProductRow {
  const variants = demoDb.variantsOf(p.id);
  const category = demoDb.category(p.category_id);
  const image = demoDb.imagesOf(p.id)[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    compareAtPrice: p.compare_at_price,
    status: statusOf(p),
    featured: p.featured,
    stock: stockOf(p),
    variantCount: variants.length,
    soldOutVariants: variants.filter((v) => v.stock_quantity <= 0).length,
    salesCount: p.sales_count,
    createdAt: p.created_at ?? daysAgo(p.created_days_ago),
    category: category ? { id: category.id, name: category.name } : null,
    image: image ? { url: image.url, alt: image.alt_text ?? p.name } : null,
  };
}

/** The category and all of its descendants. */
function categoryTree(rootId: string): Set<string> {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of demoData.categories) if (c.parent_id === ids[i] && !ids.includes(c.id)) ids.push(c.id);
  }
  return new Set(ids);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function demoAdminListProducts(query: AdminProductQuery): AdminProductList {
  const all = demoData.products.map(toRow);
  const categories = query.category ? categoryTree(query.category) : null;
  const term = query.q.toLowerCase();
  const variantHits = term
    ? new Set(demoData.product_variants.filter((v) => v.sku.toLowerCase().includes(term)).map((v) => v.product_id))
    : null;

  const filtered = all.filter(
    (r) =>
      (!query.status || r.status === query.status) &&
      (!categories || (r.category !== null && categories.has(r.category.id))) &&
      matchesStock(r, query.stock) &&
      (!term ||
        r.name.toLowerCase().includes(term) ||
        r.sku.toLowerCase().includes(term) ||
        r.slug.includes(term) ||
        Boolean(variantHits?.has(r.id))),
  );

  return { ...paginate(sortProductRows(filtered, query.sort), query.page), counts: countProducts(all), truncated: false };
}

/** Seeded orders plus orders placed on this server that include the product. */
const ordersWith = (productId: string) =>
  demoData.orders.filter((o) => o.items.some((i) => i.product_id === productId)).length +
  adminLiveDemoOrders().filter((live) => live.order.items.some((i) => i.p === productId)).length;

function deleteBlockedReason(productId: string, orderCount: number): string | null {
  if (orderCount > 0) return `It appears on ${orderCount === 1 ? "an order" : `${orderCount} orders`}. Archive it instead to take it off the store.`;
  if (!createdIds().has(productId)) return "Sample products in the demo store can’t be deleted. Archive it instead to take it off the store.";
  return null;
}

export function demoAdminGetProduct(id: string): AdminProductDetail | null {
  const p = demoDb.product(id) as ProductRow | null;
  if (!p) return null;
  const orderCount = ordersWith(id);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    status: statusOf(p),
    featured: p.featured,
    categoryId: demoDb.category(p.category_id) ? p.category_id : null,
    collectionIds: demoDb.collectionsOf(p.id).map((c) => c.id),
    shortDescription: p.short_description,
    description: p.description,
    material: p.material,
    careInstructions: p.care_instructions,
    details: Array.isArray(p.details) ? p.details.map(({ label, value }) => ({ label, value })) : [],
    price: p.price,
    compareAtPrice: p.compare_at_price,
    stock: p.stock_quantity ?? 0,
    variants: demoDb.variantsOf(p.id).map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      colorHex: v.color_hex,
      sku: v.sku,
      price: v.price,
      stock: v.stock_quantity,
    })),
    // Demo image rows have no ids; the editor saves the whole list.
    images: demoDb.imagesOf(p.id).map((i) => ({ id: null, url: i.url, alt: i.alt_text ?? "" })),
    salesCount: p.sales_count,
    ratingAvg: p.rating_avg,
    ratingCount: p.rating_count,
    createdAt: p.created_at ?? daysAgo(p.created_days_ago),
    updatedAt: p.updated_at ?? null,
    orderCount,
    deleteBlockedReason: deleteBlockedReason(p.id, orderCount),
  };
}

export function demoAdminFormOptions(): ProductFormOptions {
  return {
    categories: [...demoData.categories]
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id, isActive: c.is_active !== false })),
    collections: [...demoData.collections]
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, name: c.name, isActive: c.is_active !== false })),
    imageLibrary: demoImageLibrary(),
    uploadsEnabled: false,
  };
}

/** The product already using this slug (other than `excludeId`), if any. */
export function demoSlugOwner(slug: string, excludeId: string | null): { id: string; name: string } | null {
  const p = demoDb.productBySlug(slug);
  return p && p.id !== excludeId ? { id: p.id, name: p.name } : null;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const push = (errors: FieldErrors, path: string, message: string) => void (errors[path] ??= []).push(message);

/** Checks that need the data. Returns field errors (empty when valid). */
function checkRefs(input: ProductFormOutput, id: string | null): FieldErrors {
  const errors: FieldErrors = {};

  const slugOwner = demoSlugOwner(input.slug, id);
  if (slugOwner) push(errors, "slug", `Already used by “${slugOwner.name}”`);

  const skuOwner = demoData.products.find((p) => p.id !== id && p.sku.toUpperCase() === input.sku);
  if (skuOwner) push(errors, "sku", `Already used by “${skuOwner.name}”`);

  if (!demoDb.category(input.categoryId)) push(errors, "categoryId", "Choose a category from the list");
  if (input.collectionIds.some((c) => !demoDb.collection(c))) push(errors, "collectionIds", "One of the collections no longer exists");

  input.variants.forEach((v, i) => {
    if (v.id && demoDb.variant(v.id)?.product_id !== id) push(errors, `variants.${i}.sku`, "This variant no longer exists. Reload the page and try again.");
    const other = demoData.product_variants.find((row) => row.product_id !== id && row.sku.toUpperCase() === v.sku);
    if (other) push(errors, `variants.${i}.sku`, `Already used by “${demoDb.product(other.product_id)?.name ?? "another product"}”`);
  });

  const allowed = new Set([...demoImageLibrary(), ...(id ? demoDb.imagesOf(id).map((i) => i.url) : [])]);
  input.images.forEach((img, i) => {
    if (!allowed.has(img.url)) push(errors, `images.${i}.url`, "Choose this image from the library");
  });

  return errors;
}

function productFields(input: ProductFormOutput) {
  return {
    category_id: input.categoryId,
    name: input.name,
    slug: input.slug,
    short_description: input.shortDescription,
    description: input.description,
    price: input.price,
    compare_at_price: input.compareAtPrice,
    sku: input.sku,
    featured: input.featured,
    material: input.material,
    care_instructions: input.careInstructions,
    details: input.details.map(({ label, value }) => ({ label, value })),
    status: input.status,
    stock_quantity: input.variants.length ? 0 : input.stock,
  };
}

function variantFields(v: ProductFormOutput["variants"][number], position: number) {
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

/** Next free position at the end of a collection. */
const endOfCollection = (collectionId: string) =>
  demoData.product_collections.reduce((max, pc) => (pc.collection_id === collectionId ? Math.max(max, pc.position + 1) : max), 0);

/** Removes every row matching `drop`, in place. */
function removeWhere<T>(rows: T[], drop: (row: T) => boolean): void {
  for (let i = rows.length - 1; i >= 0; i--) if (drop(rows[i])) rows.splice(i, 1);
}

/** Creates (id null) or updates a product with its variants, images and collections, all at once. */
export function demoAdminSaveProduct(input: ProductFormOutput, id: string | null): DemoSaveResult {
  const existing = id ? (demoDb.product(id) as ProductRow | null) : null;
  if (id && !existing) return { ok: false, error: "This product no longer exists." };

  if (!id) {
    const live = [...createdIds()].filter((p) => demoDb.product(p)).length;
    if (live >= RUNTIME_LIMITS.products) {
      return { ok: false, error: `The demo store keeps up to ${RUNTIME_LIMITS.products} new products. Delete one you added to create another.` };
    }
  }

  const fieldErrors = checkRefs(input, id);
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

  const now = new Date().toISOString();
  const productId = id ?? randomUUID();
  const previousSlug = existing && existing.slug !== input.slug ? existing.slug : null;

  // Everything below is synchronous, so shoppers never see a half-saved product.
  mutateDemoData((data) => {
    if (existing) {
      Object.assign(existing, productFields(input), { updated_at: now });
    } else {
      const row: ProductRow = {
        id: productId,
        ...productFields(input),
        sales_count: 0,
        created_days_ago: 0,
        rating_avg: 0,
        rating_count: 0,
        created_at: now,
        updated_at: now,
      };
      data.products.push(row);
    }

    // Variants keep their ids (bags reference them); removed ones are dropped.
    const kept = new Set(input.variants.flatMap((v) => (v.id ? [v.id] : [])));
    removeWhere(data.product_variants, (v) => v.product_id === productId && !kept.has(v.id));
    input.variants.forEach((v, position) => {
      const row = v.id ? demoDb.variant(v.id) : null;
      if (row) Object.assign(row, variantFields(v, position));
      else data.product_variants.push({ id: randomUUID(), product_id: productId, ...variantFields(v, position) } satisfies DemoVariant);
    });

    removeWhere(data.product_images, (img) => img.product_id === productId);
    input.images.forEach((img, position) => data.product_images.push({ product_id: productId, url: img.url, alt_text: img.alt, position }));

    const before = new Map(data.product_collections.filter((pc) => pc.product_id === productId).map((pc) => [pc.collection_id, pc.position]));
    removeWhere(data.product_collections, (pc) => pc.product_id === productId);
    for (const collectionId of input.collectionIds) {
      const position = before.get(collectionId) ?? endOfCollection(collectionId);
      data.product_collections.push({ product_id: productId, collection_id: collectionId, position } satisfies DemoProductCollection);
    }
  });

  if (!id) createdIds().add(productId);
  return { ok: true, id: productId, slug: input.slug, previousSlug };
}

/** Sets the status of the given products. Returns the slugs that changed. */
export function demoAdminSetStatus(ids: string[], status: ProductStatus): string[] {
  const rows = ids.map((id) => demoDb.product(id) as ProductRow | null).filter((p): p is ProductRow => p !== null && statusOf(p) !== status);
  if (rows.length) {
    const now = new Date().toISOString();
    mutateDemoData(() => {
      for (const p of rows) Object.assign(p, { status, updated_at: now });
    });
  }
  return rows.map((p) => p.slug);
}

/** Features or un-features the given products. Returns the slugs that changed. */
export function demoAdminSetFeatured(ids: string[], featured: boolean): string[] {
  const rows = ids.map((id) => demoDb.product(id) as ProductRow | null).filter((p): p is ProductRow => p !== null && p.featured !== featured);
  if (rows.length) {
    const now = new Date().toISOString();
    mutateDemoData(() => {
      for (const p of rows) Object.assign(p, { featured, updated_at: now });
    });
  }
  return rows.map((p) => p.slug);
}

/** Deletes a product the demo admin created, if no order references it. */
export function demoAdminDeleteProduct(id: string): { ok: true; slug: string } | { ok: false; error: string } {
  const p = demoDb.product(id);
  if (!p) return { ok: false, error: "This product no longer exists." };
  const blocked = deleteBlockedReason(id, ordersWith(id));
  if (blocked) return { ok: false, error: `“${p.name}” can’t be deleted. ${blocked}` };

  mutateDemoData((data) => {
    removeWhere(data.product_variants, (v) => v.product_id === id);
    removeWhere(data.product_images, (img) => img.product_id === id);
    removeWhere(data.product_collections, (pc) => pc.product_id === id);
    removeWhere(data.reviews, (r) => r.product_id === id);
    removeWhere(data.products, (row) => row.id === id);
  });
  createdIds().delete(id);
  return { ok: true, slug: p.slug };
}
