import { Panel, formatDateTime } from "@/features/admin/ui";
import type { AdminProductDetail } from "./model";

/** Sales, rating and dates for the editor sidebar (server-rendered, so dates use one time zone). */
export function ProductPerformance({ product }: { product: AdminProductDetail }) {
  const stats = [
    { label: "Units sold", value: product.salesCount.toLocaleString("en-US") },
    { label: "Orders", value: product.orderCount.toLocaleString("en-US") },
    { label: "Rating", value: product.ratingCount ? `${product.ratingAvg.toFixed(1)} / 5 (${product.ratingCount})` : "No reviews" },
    { label: "Created", value: formatDateTime(product.createdAt) },
  ];
  return (
    <Panel title="Performance">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-[14px]">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-ink-3">{s.label}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{s.value}</dd>
          </div>
        ))}
        {product.updatedAt && (
          <div className="col-span-2">
            <dt className="text-[12px] text-ink-3">Last updated</dt>
            <dd className="mt-0.5 font-medium">{formatDateTime(product.updatedAt)}</dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}
