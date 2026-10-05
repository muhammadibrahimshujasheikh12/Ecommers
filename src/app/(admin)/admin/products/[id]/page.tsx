import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/features/admin/ui";
import { ProductEditor } from "@/features/admin/products/product-editor";
import { StatusBadge, StockBadge } from "@/features/admin/products/badges";
import { productIdSchema } from "@/features/admin/products/schema";
import { getAdminUser, requireAdminPage } from "@/lib/admin/auth";
import { getAdminProduct, getProductFormOptions } from "@/lib/admin/products";
import { formatPrice } from "@/utils/format";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  // Metadata renders even for visitors who only see the admin gate: never reveal product names to them.
  if (!(await getAdminUser())) return {};
  const { id } = await params;
  const product = productIdSchema.safeParse(id).success ? await getAdminProduct(id) : null;
  return { title: product ? product.name : "Product not found" };
}

export default async function EditProductPage({ params }: { params: Params }) {
  await requireAdminPage();
  const { id } = await params;
  if (!productIdSchema.safeParse(id).success) notFound();
  const [product, options] = await Promise.all([getAdminProduct(id), getProductFormOptions()]);
  if (!product) notFound();

  const stock = product.variants.length ? product.variants.reduce((n, v) => n + v.stock, 0) : product.stock;

  return (
    <>
      <AdminPageHeader
        title={product.name}
        crumbs={[{ name: "Products", href: "/admin/products" }, { name: product.name }]}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <StatusBadge status={product.status} />
            <span>{formatPrice(product.price)}</span>
            <span className="inline-flex items-center gap-2">
              {stock.toLocaleString("en-US")} in stock
              <StockBadge stock={stock} />
            </span>
            <span className="text-ink-3">SKU {product.sku}</span>
          </span>
        }
      />
      {/* Remount after each save so the form starts from the saved rows (new variant ids, normalised values). */}
      <ProductEditor key={`${product.id}:${product.updatedAt ?? ""}`} product={product} options={options} />
    </>
  );
}
