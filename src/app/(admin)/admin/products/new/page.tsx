import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/ui";
import { ProductEditor } from "@/features/admin/products/product-editor";
import { requireAdminPage } from "@/lib/admin/auth";
import { getProductFormOptions } from "@/lib/admin/products";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const admin = await requireAdminPage();
  const options = await getProductFormOptions();
  return (
    <>
      <AdminPageHeader
        title="New product"
        crumbs={[{ name: "Products", href: "/admin/products" }, { name: "New product" }]}
        description={
          admin.demo
            ? "New products start as drafts, hidden from the store until you set them to active. The demo store keeps up to 50 new products."
            : "New products start as drafts, hidden from the store until you set them to active."
        }
      />
      <ProductEditor product={null} options={options} />
    </>
  );
}
