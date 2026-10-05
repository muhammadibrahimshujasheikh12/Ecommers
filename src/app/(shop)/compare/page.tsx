import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { CompareView } from "@/features/compare/compare-view";
import { getSuggestedProducts } from "@/features/recommendations/data";
import { SuggestionRail } from "@/features/recommendations/suggestion-rail";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Compare Products", path: "/compare", noIndex: true });

export default async function ComparePage() {
  const picks = await getSuggestedProducts("featured");
  return (
    <div className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Compare" }]} />
      <h1 className="heading-page mb-10 mt-8">Compare Products</h1>
      <CompareView suggestions={<SuggestionRail id="compare-suggestions" eyebrow="Start with these" title="Editor’s Picks" href="/shop" linkLabel="Shop all" products={picks} />} />
    </div>
  );
}
