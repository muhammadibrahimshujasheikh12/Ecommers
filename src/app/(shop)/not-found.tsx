import Link from "next/link";
import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <div className="container-site py-10">
      <EmptyState
        icon={<SearchX className="size-6" strokeWidth={1.2} />}
        as="h1"
        title="We couldn’t find that page"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop?sort=newest">Shop new arrivals</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          </div>
        }
      >
        The product or page may have moved or is no longer available. Try searching, or explore our{" "}
        <Link href="/collections" className="underline underline-offset-4">
          collections
        </Link>
        .
      </EmptyState>
    </div>
  );
}
