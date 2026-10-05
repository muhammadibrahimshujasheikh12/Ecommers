/*
 * Products admin: shared types, constants and pure helpers. Imported by the
 * server data layer (src/lib/admin/products.ts, src/lib/demo/admin-products.ts)
 * and by client components, so nothing here may touch the server.
 */

export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const STATUS_LABELS: Record<ProductStatus, string> = { active: "Active", draft: "Draft", archived: "Archived" };
export const STATUS_HINTS: Record<ProductStatus, string> = {
  active: "Visible in the store and can be bought.",
  draft: "Hidden from the store while you prepare it.",
  archived: "Hidden from the store; kept for order history.",
};

/** A product is "low stock" at or below this many units in total. */
export const LOW_STOCK_THRESHOLD = 10;
/** A single variant is highlighted at or below this many units. */
export const LOW_VARIANT_STOCK = 3;

export const ADMIN_PRODUCTS_PAGE_SIZE = 20;

/** Upload limits, matching the product-images Storage bucket. */
export const IMAGE_UPLOAD = { maxBytes: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/avif"] } as const;

/** Caps per product, also keeping the public demo's memory bounded. */
export const PRODUCT_LIMITS = { variants: 60, images: 12, details: 12, collections: 20, stock: 100_000, price: 10_000_000 } as const;

export const STOCK_LEVELS = ["in", "low", "out"] as const;
export type StockLevel = (typeof STOCK_LEVELS)[number];
export const STOCK_LABELS: Record<StockLevel, string> = { in: "In stock", low: "Low stock", out: "Out of stock" };

export const stockLevel = (units: number): StockLevel => (units <= 0 ? "out" : units <= LOW_STOCK_THRESHOLD ? "low" : "in");

export const PRODUCT_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name, A–Z" },
  { value: "name_desc", label: "Name, Z–A" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
  { value: "stock_asc", label: "Stock, lowest first" },
  { value: "stock_desc", label: "Stock, highest first" },
  { value: "best_selling", label: "Best selling" },
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

/** Sorts that need every row's computed stock (the rest can be ordered by the database). */
export const STOCK_SORTS: readonly ProductSort[] = ["stock_asc", "stock_desc"];

export type AdminProductQuery = {
  q: string;
  /** Category id (includes its sub-categories) or "". */
  category: string;
  status: ProductStatus | "";
  stock: StockLevel | "";
  sort: ProductSort;
  page: number;
};

/** One row of the products table. */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  featured: boolean;
  /** Units available to sell: the sum over variants, or product stock without variants. */
  stock: number;
  variantCount: number;
  soldOutVariants: number;
  salesCount: number;
  createdAt: string;
  category: { id: string; name: string } | null;
  image: { url: string; alt: string } | null;
};

export type AdminProductCounts = { all: number; active: number; draft: number; archived: number; low: number; out: number };

export type AdminProductList = {
  rows: AdminProductRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: AdminProductCounts;
  /** True when a stock filter/sort only covered the first rows the database returned. */
  truncated: boolean;
};

export type AdminCategoryOption = { id: string; name: string; parentId: string | null; isActive: boolean };
export type AdminCollectionOption = { id: string; name: string; isActive: boolean };

export type ProductFormOptions = {
  categories: AdminCategoryOption[];
  collections: AdminCollectionOption[];
  /** Bundled photos in public/images/products, offered by the image picker. */
  imageLibrary: string[];
  /** Upload to Supabase Storage (not available in the demo store). */
  uploadsEnabled: boolean;
};

export type AdminVariant = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  sku: string;
  price: number | null;
  stock: number;
};

export type AdminProductImage = { id: string | null; url: string; alt: string };

/** Everything the editor needs for an existing product. */
export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: ProductStatus;
  featured: boolean;
  categoryId: string | null;
  collectionIds: string[];
  shortDescription: string | null;
  description: string | null;
  material: string | null;
  careInstructions: string | null;
  details: { label: string; value: string }[];
  price: number;
  compareAtPrice: number | null;
  /** Product-level stock, used only when there are no variants. */
  stock: number;
  variants: AdminVariant[];
  images: AdminProductImage[];
  salesCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string | null;
  /** Orders that include this product (order history keeps a snapshot either way). */
  orderCount: number;
  /** Why it can't be deleted permanently (archive instead), or null. */
  deleteBlockedReason: string | null;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** "Gul-e-Nar Lawn ’26" -> "gul-e-nar-lawn-26" (matches the public.slug domain). */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Display name of a variant, as stored in product_variants.name ("Mint / XS"). */
export function variantName(color: string | null | undefined, size: string | null | undefined): string {
  return [color?.trim(), size?.trim()].filter(Boolean).join(" / ") || "Default";
}

const byText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

/** Orders rows for the table. Ties fall back to newest first, then id, so pages are stable. */
export function sortProductRows(rows: AdminProductRow[], sort: ProductSort): AdminProductRow[] {
  const newest = (a: AdminProductRow, b: AdminProductRow) => b.createdAt.localeCompare(a.createdAt) || byText(a.id, b.id);
  const compare: Record<ProductSort, (a: AdminProductRow, b: AdminProductRow) => number> = {
    newest,
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt) || byText(a.id, b.id),
    name_asc: (a, b) => byText(a.name, b.name),
    name_desc: (a, b) => byText(b.name, a.name),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    stock_asc: (a, b) => a.stock - b.stock,
    stock_desc: (a, b) => b.stock - a.stock,
    best_selling: (a, b) => b.salesCount - a.salesCount,
  };
  return [...rows].sort((a, b) => compare[sort](a, b) || newest(a, b));
}

export const matchesStock = (row: Pick<AdminProductRow, "stock">, stock: StockLevel | "") => !stock || stockLevel(row.stock) === stock;

/** Counts for the status tabs and inventory summary. */
export function countProducts(rows: { status: ProductStatus; stock: number }[]): AdminProductCounts {
  const counts: AdminProductCounts = { all: rows.length, active: 0, draft: 0, archived: 0, low: 0, out: 0 };
  for (const r of rows) {
    counts[r.status] += 1;
    // Inventory alerts only matter for products on sale.
    if (r.status === "active") {
      const level = stockLevel(r.stock);
      if (level !== "in") counts[level] += 1;
    }
  }
  return counts;
}

export function paginate<T>(rows: T[], page: number, pageSize = ADMIN_PRODUCTS_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return { rows: rows.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount, pageSize, total: rows.length };
}
