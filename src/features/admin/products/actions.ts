"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/auth";
import {
  deleteProduct,
  discardProductUpload,
  findSlugOwner,
  saveProduct,
  setProductsFeatured,
  setProductsStatus,
  uploadProductImage,
} from "@/lib/admin/products";
import { DEMO_MODE } from "@/lib/demo/mode";
import { CATALOG_TAG } from "@/lib/supabase/public";
import type { ActionResult } from "@/types/domain";
import { STATUS_LABELS, type ProductStatus } from "./model";
import { productFormSchema, productIdSchema, productIdsSchema, productStatusSchema, slugCheckSchema } from "./schema";

/*
 * Products admin Server Actions. Each one checks admin access first, then
 * validates every argument with zod (ids, statuses and prices from the
 * browser are never trusted), then calls the data layer, which checks access
 * again and, with Supabase, runs under the admin's own session so RLS applies.
 */

const fieldErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string[]> = {};
  for (const issue of issues) (out[issue.path.map(String).join(".") || "form"] ??= []).push(issue.message);
  return out;
};

const failed = (error: string): ActionResult<never> => ({ ok: false, error });

/** Refreshes the storefront (catalogue cache and every page) and the admin product screens. */
function revalidateCatalog() {
  if (!DEMO_MODE) revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export async function saveProductAction(input: unknown, productId: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;

  const id = z.union([z.null(), productIdSchema]).safeParse(productId);
  if (!id.success) return failed("This product could not be found.");
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };

  try {
    const result = await saveProduct(parsed.data, id.data);
    if (!result.ok) return { ok: false, error: result.error, fieldErrors: result.fieldErrors };
    revalidateCatalog();
    return { ok: true, data: { id: result.id, slug: result.slug }, message: id.data ? "Product saved." : "Product created." };
  } catch (e) {
    console.error("saveProductAction", e);
    return failed("We couldn’t save this product. Please try again.");
  }
}

/** Live check while typing the URL handle. */
export async function checkProductSlugAction(slug: unknown, excludeId: unknown): Promise<ActionResult<{ available: boolean; usedBy: string | null }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsed = slugCheckSchema.safeParse({ slug, excludeId });
  if (!parsed.success) return failed("Use lowercase letters, numbers and single hyphens.");
  try {
    const owner = await findSlugOwner(parsed.data.slug, parsed.data.excludeId);
    return { ok: true, data: { available: !owner, usedBy: owner?.name ?? null } };
  } catch (e) {
    console.error("checkProductSlugAction", e);
    return failed("We couldn’t check this URL handle.");
  }
}

export async function setProductsStatusAction(ids: unknown, status: unknown): Promise<ActionResult<{ changed: number }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsedIds = productIdsSchema.safeParse(ids);
  if (!parsedIds.success) return failed(parsedIds.error.issues[0]?.message ?? "Select products to update.");
  const parsedStatus = productStatusSchema.safeParse(status);
  if (!parsedStatus.success) return failed("Choose a valid status.");

  try {
    const changed = await setProductsStatus([...new Set(parsedIds.data)], parsedStatus.data);
    if (changed.length) revalidateCatalog();
    const label = STATUS_LABELS[parsedStatus.data as ProductStatus].toLowerCase();
    return {
      ok: true,
      data: { changed: changed.length },
      message: changed.length ? `${plural(changed.length, "product")} set to ${label}.` : `Already ${label}.`,
    };
  } catch (e) {
    console.error("setProductsStatusAction", e);
    return failed("We couldn’t update these products. Please try again.");
  }
}

export async function setProductsFeaturedAction(ids: unknown, featured: unknown): Promise<ActionResult<{ changed: number }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsedIds = productIdsSchema.safeParse(ids);
  if (!parsedIds.success) return failed(parsedIds.error.issues[0]?.message ?? "Select products to update.");
  const parsedFeatured = z.boolean().safeParse(featured);
  if (!parsedFeatured.success) return failed("Invalid request.");

  try {
    const changed = await setProductsFeatured([...new Set(parsedIds.data)], parsedFeatured.data);
    if (changed.length) revalidateCatalog();
    return {
      ok: true,
      data: { changed: changed.length },
      message: `${plural(changed.length, "product")} ${parsedFeatured.data ? "featured" : "no longer featured"}.`,
    };
  } catch (e) {
    console.error("setProductsFeaturedAction", e);
    return failed("We couldn’t update these products. Please try again.");
  }
}

export async function deleteProductAction(id: unknown): Promise<ActionResult> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsed = productIdSchema.safeParse(id);
  if (!parsed.success) return failed("This product could not be found.");
  try {
    const result = await deleteProduct(parsed.data);
    if (!result.ok) return failed(result.error);
    revalidateCatalog();
    return { ok: true, data: undefined, message: "Product deleted." };
  } catch (e) {
    console.error("deleteProductAction", e);
    return failed("We couldn’t delete this product. Please try again.");
  }
}

/** Uploads one product photo (Supabase Storage). The form saves the returned URL with the product. */
export async function uploadProductImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const file = formData.get("file");
  if (!(file instanceof File)) return failed("Choose an image to upload.");
  try {
    const result = await uploadProductImage(file);
    return result.ok ? { ok: true, data: { url: result.url } } : failed(result.error);
  } catch (e) {
    console.error("uploadProductImageAction", e);
    return failed("The upload failed. Please try again.");
  }
}

/** Deletes an unsaved upload the admin removed from the editor (ignored if anything uses it). */
export async function discardProductUploadAction(url: unknown): Promise<ActionResult> {
  const { admin, denied } = await requireAdminAction();
  if (!admin) return denied;
  const parsed = z.string().max(1000).safeParse(url);
  if (!parsed.success) return failed("Invalid image.");
  try {
    await discardProductUpload(parsed.data);
  } catch (e) {
    console.error("discardProductUploadAction", e);
  }
  return { ok: true, data: undefined };
}
