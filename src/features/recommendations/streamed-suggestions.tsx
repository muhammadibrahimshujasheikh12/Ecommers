import { Suspense } from "react";
import { getSuggestedProducts, type SuggestionRailKind } from "./data";
import { SuggestionRail, SuggestionRailSkeleton, type SuggestionRailProps } from "./suggestion-rail";

type Props = SuggestionRailProps & { rail: SuggestionRailKind; exclude?: string[] };

async function SuggestedProducts({ rail, exclude, ...props }: Props) {
  const products = await getSuggestedProducts(rail, 4, exclude);
  return <SuggestionRail products={products} {...props} />;
}

/**
 * For Server Components that only learn a view is empty (or sparse) after
 * their own fetch — zero results, no orders yet: the rail streams in behind
 * the page instead of delaying it.
 */
export function StreamedSuggestions(props: Props) {
  return (
    <Suspense fallback={<SuggestionRailSkeleton compact={props.compact} divider={props.divider} />}>
      <SuggestedProducts {...props} />
    </Suspense>
  );
}
