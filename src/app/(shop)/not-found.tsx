import Link from "next/link";
import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getSuggestedProducts } from "@/features/recommendations/data";
import { PopularSearchLinks } from "@/features/recommendations/popular-searches";
import { SuggestionRail } from "@/features/recommendations/suggestion-rail";

export default async function NotFound() {
  const picks = await getSuggestedProducts("new");
  return (
    <div className="container-site pb-20 pt-10 md:pb-28">
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
      <PopularSearchLinks label="Or start with" align="center" className="mx-auto -mt-4 mb-16 max-w-xl md:-mt-8 md:mb-24" />
      <SuggestionRail id="not-found-suggestions" eyebrow="While you’re here" title="New Arrivals" href="/shop?sort=newest" linkLabel="View all" products={picks} />
    </div>
  );
}
