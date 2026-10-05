import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function AdminOrderNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-cream">
        <SearchX aria-hidden className="size-6" strokeWidth={1.4} />
      </span>
      <h1 className="mt-6 font-display text-[34px] font-medium leading-tight">Order not found</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
        This order doesn’t exist, or it is no longer kept. Demo orders placed on this server reset when it restarts.
      </p>
      <Link href="/admin/orders" className={buttonClasses({ size: "sm", className: "mt-8" })}>
        Back to orders
      </Link>
    </div>
  );
}
