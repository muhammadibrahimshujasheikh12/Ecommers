import type { Database } from "./database";

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export type ImageAsset = { url: string; alt: string };

export type Swatch = { name: string; hex: string | null };

export type VariantOption = {
  id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  stock: number;
};

/** Everything a product card / grid needs. */
export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  category: { name: string; slug: string } | null;
  price: number;
  compareAtPrice: number | null;
  images: ImageAsset[];
  colors: Swatch[];
  sizes: string[];
  variants: VariantOption[];
  inStock: boolean;
  isNew: boolean;
  rating: number;
  ratingCount: number;
};

export type ProductDetail = ProductSummary & {
  sku: string;
  shortDescription: string | null;
  description: string | null;
  material: string | null;
  careInstructions: string | null;
  details: { label: string; value: string }[];
  collections: { name: string; slug: string }[];
  parentCategory: { name: string; slug: string } | null;
  salesCount: number;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
};

export type CategoryDetail = CategorySummary & {
  parent: CategorySummary | null;
  children: CategorySummary[];
};

export type CollectionSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

export type Facets = {
  sizes: string[];
  colors: Swatch[];
  price: { min: number; max: number };
  collections: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
};

export type SortOption = "featured" | "newest" | "price_asc" | "price_desc" | "best_selling" | "rating";

export type ProductFilters = {
  q?: string;
  categories?: string[];
  collections?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: "in_stock" | "out_of_stock";
  sizes?: string[];
  colors?: string[];
  minRating?: number;
  onSale?: boolean;
  sort: SortOption;
  page: number;
};

export type ProductPage = {
  products: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  content: string;
  authorName: string;
  verifiedPurchase: boolean;
  status: Database["public"]["Enums"]["review_status"];
  createdAt: string;
  images: string[];
};

export type ReviewSummary = {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type CartLineStatus =
  | "ok"
  | "insufficient_stock"
  | "sold_out"
  | "unavailable"
  | "variant_required"
  | "invalid_quantity";

export type CartLine = {
  lineId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  sku: string;
  variantName: string | null;
  size: string | null;
  color: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  lineTotal: number;
  available: number;
  status: CartLineStatus;
};

export type ShippingOption = {
  code: string;
  name: string;
  description: string | null;
  cost: number;
  basePrice: number;
  freeShippingThreshold: number | null;
  minDays: number;
  maxDays: number;
};

export type CartView = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  discount: number;
  coupon: { code: string; valid: boolean; description: string | null; message: string | null } | null;
  shippingMethods: ShippingOption[];
  shippingMethod: string | null;
  shipping: number;
  tax: number;
  total: number;
  currency: "PKR";
  canCheckout: boolean;
};

export type Address = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

export type OrderAddress = {
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

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  firstImage: string | null;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingMethodName: string | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  couponCode: string | null;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  notes: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    productSlug: string | null;
    imageUrl: string | null;
    sku: string;
    variantName: string | null;
    size: string | null;
    color: string | null;
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
  history: { status: OrderStatus; note: string | null; createdAt: string }[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
