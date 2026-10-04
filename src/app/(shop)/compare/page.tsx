import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/misc";
import { CompareView } from "@/features/compare/compare-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ title: "Compare Products", path: "/compare", noIndex: true });

export default function ComparePage() {
  return (
    <div className="container-site pb-24 pt-8 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Compare" }]} />
      <h1 className="heading-page mb-10 mt-8">Compare Products</h1>
      <CompareView />
    </div>
  );
}
