import "server-only";
import type { OrderStatus, PaymentStatus } from "@/types/domain";
import raw from "./dataset.json";

/*
 * Demo catalogue, generated from scripts/seed/catalog.mjs by
 * `npm run seed:generate` (the same rows as supabase/seed.sql). Row shapes
 * mirror the database tables; timestamps are "days ago" so the demo always
 * looks current.
 *
 * The rows live in server memory for the life of the process and the demo
 * admin edits them in place through mutateDemoData(), so changes show on the
 * storefront for every visitor until the server restarts. Optional flags
 * (status, is_active, is_published) are absent in the generated data and
 * mean "live" when missing.
 */

export type DemoCategory = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active?: boolean;
};

export type DemoCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active?: boolean;
};

export type DemoProduct = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string;
  featured: boolean;
  material: string | null;
  care_instructions: string | null;
  details: { label: string; value: string }[];
  sales_count: number;
  created_days_ago: number;
  rating_avg: number;
  rating_count: number;
  /** Absent means "active". */
  status?: "active" | "draft" | "archived";
};

export type DemoProductImage = { product_id: string; url: string; alt_text: string | null; position: number };

export type DemoVariant = {
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
};

export type DemoProductCollection = { product_id: string; collection_id: string; position: number };

export type DemoShippingMethod = {
  code: string;
  name: string;
  description: string | null;
  price: number;
  free_shipping_threshold: number | null;
  min_days: number;
  max_days: number;
  countries: string[] | null;
  position: number;
  is_active?: boolean;
};

export type DemoCoupon = {
  code: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: number;
  minimum_order: number;
  maximum_discount: number | null;
  usage_limit_per_customer: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active?: boolean;
  /** Total redemptions allowed across all customers (null = unlimited). */
  usage_limit?: number | null;
};

export type DemoPage = {
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  updated_at: string;
  is_published?: boolean;
};

export type DemoReview = {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string;
  content: string;
  verified_purchase: boolean;
  status: "approved" | "pending" | "rejected";
  created_days_ago: number;
};

export type DemoOrderAddress = {
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country: string;
};

export type DemoSeedOrder = {
  id: string;
  order_number: string;
  access_token: string;
  user_id: string;
  email: string;
  phone: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  shipping_method: string;
  shipping_method_name: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  shipping_address: DemoOrderAddress;
  billing_address: DemoOrderAddress;
  notes: string | null;
  created_days_ago: number;
  items: {
    id: string;
    product_id: string;
    variant_id: string;
    product_name: string;
    product_slug: string;
    image_url: string;
    sku: string;
    variant_name: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
  }[];
  history: { status: string; note: string | null; created_days_ago: number }[];
  payment_reference?: string | null;
};

export type DemoDataset = {
  categories: DemoCategory[];
  collections: DemoCollection[];
  products: DemoProduct[];
  product_images: DemoProductImage[];
  product_variants: DemoVariant[];
  product_collections: DemoProductCollection[];
  shipping_methods: DemoShippingMethod[];
  coupons: DemoCoupon[];
  pages: DemoPage[];
  reviews: DemoReview[];
  orders: DemoSeedOrder[];
};

type Indexes = ReturnType<typeof buildIndexes>;
type DemoState = { data: DemoDataset; idx: Indexes; version: number };

const group = <T, K>(rows: T[], key: (row: T) => K) => {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
};

function buildIndexes(data: DemoDataset) {
  return {
    productsById: new Map(data.products.map((p) => [p.id, p])),
    productsBySlug: new Map(data.products.map((p) => [p.slug, p])),
    variantsById: new Map(data.product_variants.map((v) => [v.id, v])),
    variantsByProduct: group(data.product_variants, (v) => v.product_id),
    imagesByProduct: group(data.product_images, (i) => i.product_id),
    collectionsByProduct: group(data.product_collections, (pc) => pc.product_id),
    categoriesById: new Map(data.categories.map((c) => [c.id, c])),
    categoriesBySlug: new Map(data.categories.map((c) => [c.slug, c])),
    collectionsById: new Map(data.collections.map((c) => [c.id, c])),
    collectionsBySlug: new Map(data.collections.map((c) => [c.slug, c])),
  };
}

// Kept on globalThis so every server bundle (pages, actions, route handlers)
// shares one copy, and dev hot-reloads keep admin edits.
const holder = globalThis as typeof globalThis & { __auraqDemoState?: DemoState };
const state: DemoState = (holder.__auraqDemoState ??= (() => {
  const data = structuredClone(raw) as unknown as DemoDataset;
  return { data, idx: buildIndexes(data), version: 0 };
})());

/**
 * The live demo rows. Read through this object (e.g. `demoData.products`) at
 * call time; never cache arrays from it at module scope.
 */
export const demoData: DemoDataset = state.data;

/**
 * Applies an admin change to the demo rows and rebuilds the indexes. Mutate
 * arrays and rows in place (push/splice/assign), never replace them.
 */
export function mutateDemoData(change: (data: DemoDataset) => void): void {
  change(state.data);
  state.idx = buildIndexes(state.data);
  state.version += 1;
}

/** Increments on every admin change; handy for memoising derived data. */
export function demoDataVersion(): number {
  return state.version;
}

/** ISO timestamp for "n days ago" (fractional days allowed). */
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const demoDb = {
  product: (id: string) => state.idx.productsById.get(id) ?? null,
  productBySlug: (slug: string) => state.idx.productsBySlug.get(slug) ?? null,
  variant: (id: string) => state.idx.variantsById.get(id) ?? null,
  variantsOf: (productId: string) => [...(state.idx.variantsByProduct.get(productId) ?? [])].sort((a, b) => a.position - b.position),
  imagesOf: (productId: string) => [...(state.idx.imagesByProduct.get(productId) ?? [])].sort((a, b) => a.position - b.position),
  category: (id: string) => state.idx.categoriesById.get(id) ?? null,
  categoryBySlug: (slug: string) => state.idx.categoriesBySlug.get(slug) ?? null,
  /** The category and all of its descendants. */
  categoryTreeIds: (slug: string): string[] => {
    const root = state.idx.categoriesBySlug.get(slug);
    if (!root) return [];
    const ids = [root.id];
    for (let i = 0; i < ids.length; i++) {
      for (const c of demoData.categories) if (c.parent_id === ids[i]) ids.push(c.id);
    }
    return ids;
  },
  collection: (id: string) => state.idx.collectionsById.get(id) ?? null,
  collectionBySlug: (slug: string) => state.idx.collectionsBySlug.get(slug) ?? null,
  collectionsOf: (productId: string) =>
    (state.idx.collectionsByProduct.get(productId) ?? [])
      .map((pc) => state.idx.collectionsById.get(pc.collection_id))
      .filter((c): c is DemoCollection => Boolean(c)),
  /** Total stock across variants (or 0). */
  stockOf: (productId: string) => (state.idx.variantsByProduct.get(productId) ?? []).reduce((n, v) => n + v.stock_quantity, 0),
};
