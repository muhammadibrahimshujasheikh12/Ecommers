import { AdminBadge } from "@/features/admin/ui";
import type { OrderStatus, PaymentStatus } from "@/types/domain";
import { statusLabel } from "@/utils/format";
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE } from "./status";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <AdminBadge tone={ORDER_STATUS_TONE[status] ?? "neutral"} className={className}>
      {statusLabel(status)}
    </AdminBadge>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <AdminBadge tone={PAYMENT_STATUS_TONE[status] ?? "neutral"} className={className}>
      <span className="sr-only">Payment </span>
      {statusLabel(status)}
    </AdminBadge>
  );
}
