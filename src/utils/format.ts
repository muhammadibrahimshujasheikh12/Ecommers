const priceFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "Rs. 12,950" — PKR prices are shown without decimals. */
export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `Rs. ${priceFormatter.format(Math.round(n))}`;
}

export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const longDateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function formatDate(value: string | Date, long = false): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return (long ? longDateFormatter : dateFormatter).format(d);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
  paid: "Paid",
  failed: "Failed",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
