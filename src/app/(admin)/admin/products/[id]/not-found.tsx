import { PackageX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-cream">
        <PackageX aria-hidden className="size-6" strokeWidth={1.4} />
      </span>
      <h1 className="mt-5 font-display text-[34px] font-medium leading-tight">Product not found</h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-2">It may have been deleted, or the link is wrong.</p>
      <div className="mt-6">
        <ButtonLink href="/admin/products" size="sm" variant="secondary">
          Back to products
        </ButtonLink>
      </div>
    </div>
  );
}
