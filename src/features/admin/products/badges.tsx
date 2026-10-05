import { AdminBadge } from "@/features/admin/ui";
import { cn } from "@/utils/cn";
import { STATUS_LABELS, stockLevel, type AdminProductRow, type ProductStatus } from "./model";

const STATUS_TONES = { active: "success", draft: "warning", archived: "muted" } as const;

export function StatusBadge({ status }: { status: ProductStatus }) {
  return <AdminBadge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</AdminBadge>;
}

/** "Out of stock" / "Low" badge for a stock total (nothing when well stocked). */
export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock);
  if (level === "out") return <AdminBadge tone="danger">Out of stock</AdminBadge>;
  if (level === "low") return <AdminBadge tone="warning">Low</AdminBadge>;
  return null;
}

export function StockCell({ stock, variantCount, soldOutVariants }: Pick<AdminProductRow, "stock" | "variantCount" | "soldOutVariants">) {
  const level = stockLevel(stock);
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="flex items-center gap-2">
        <StockBadge stock={stock} />
        <span className={cn("tabular-nums", level === "out" && "text-sale")}>{stock.toLocaleString("en-US")}</span>
      </span>
      {stock > 0 && soldOutVariants > 0 && (
        <span className="whitespace-nowrap text-[12px] text-ink-3">
          {soldOutVariants} of {variantCount} sold out
        </span>
      )}
    </div>
  );
}
