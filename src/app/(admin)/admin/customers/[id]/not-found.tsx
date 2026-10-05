import Link from "next/link";
import { UserX } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function AdminCustomerNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-cream">
        <UserX aria-hidden className="size-6" strokeWidth={1.4} />
      </span>
      <h1 className="mt-6 font-display text-[34px] font-medium leading-tight">Customer not found</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
        There’s no customer with this link. They may have been removed, or (in the demo store) their orders reset with the server.
      </p>
      <Link href="/admin/customers" className={buttonClasses({ size: "sm", className: "mt-8" })}>
        Back to customers
      </Link>
    </div>
  );
}
