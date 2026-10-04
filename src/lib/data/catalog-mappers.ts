import type { CategorySummary, ProductSummary, Swatch, VariantOption } from "@/types/domain";

/*
 * Row -> domain mapping shared by the Supabase and demo catalogue paths, so
 * product cards and category lists look identical in both modes.
 */

const NEW_FOR_DAYS = 30;

/** Shape of a product card row (products + category, images and variants). */
export type CardRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  created_at: string;
  rating_avg: number;
  rating_count: number;
  category: { name: string; slug: string } | null;
  images: { url: string; alt_text: string | null; position: number }[];
  variants: {
    id: string;
    name: string;
    sku: string;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    price: number | null;
    stock_quantity: number;
    position: number;
  }[];
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
/** Position in the size scale; unknown sizes sort last (as in catalog_facets). */
export const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s);
  return i === -1 ? 99 : i;
};

export function toSummary(row: CardRow): ProductSummary {
  const variants: VariantOption[] = [...row.variants]
    .sort((a, b) => a.position - b.position)
    .map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      size: v.size,
      color: v.color,
      colorHex: v.color_hex,
      price: Number(v.price ?? row.price),
      stock: v.stock_quantity,
    }));

  const colors: Swatch[] = [];
  for (const v of variants) {
    if (v.color && !colors.some((c) => c.name === v.color)) colors.push({ name: v.color, hex: v.colorHex });
  }
  const sizes = [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))].sort(
    (a, b) => sizeRank(a) - sizeRank(b),
  );
  const inStock = variants.length ? variants.some((v) => v.stock > 0) : row.stock_quantity > 0;
  const ageDays = (Date.now() - new Date(row.created_at).getTime()) / 86_400_000;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : null,
    images: [...row.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ url: i.url, alt: i.alt_text ?? row.name })),
    colors,
    sizes,
    variants,
    inStock,
    isNew: ageDays <= NEW_FOR_DAYS,
    rating: Number(row.rating_avg),
    ratingCount: row.rating_count,
  };
}

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  position: number;
};

export const toCategory = (c: CategoryRow): CategorySummary => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  imageUrl: c.image_url,
  parentId: c.parent_id,
});
