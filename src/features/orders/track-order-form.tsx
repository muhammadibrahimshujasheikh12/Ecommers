"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { trackOrderSchema } from "@/lib/validation/schemas";
import { trackOrderAction } from "@/features/marketing/actions";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { formatDate, formatPrice, statusLabel } from "@/utils/format";
import type { OrderDetail } from "@/types/domain";

type Result = Pick<OrderDetail, "orderNumber" | "status" | "createdAt" | "history" | "shippingMethodName" | "items" | "total">;

export function TrackOrderForm() {
  const [order, setOrder] = useState<Result | null>(null);
  const [error, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof trackOrderSchema>>({ resolver: zodResolver(trackOrderSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setOrder(null);
    const res = await trackOrderAction(values);
    if (res.ok) setOrder(res.data);
    else setFormError(res.error);
  });

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <Input label="Order number" placeholder="AQ-100245" autoComplete="off" required error={errors.orderNumber?.message} {...register("orderNumber")} />
        <Input label="Email used for the order" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
        <Button type="submit" loading={isSubmitting} className="sm:mt-[30px]">
          Track
        </Button>
      </form>
      {error && (
        <Alert tone="error" className="mt-6">
          {error}
        </Alert>
      )}
      {order && (
        <section aria-live="polite" className="mt-10 border border-line p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[26px]">Order {order.orderNumber}</h2>
            <span className="rounded-full bg-powder px-3 py-1 font-ui text-[12px] uppercase tracking-[0.12em]">{statusLabel(order.status)}</span>
          </div>
          <p className="mt-1 font-ui text-[14px] text-ink-2">
            Placed {formatDate(order.createdAt, true)} · {formatPrice(order.total)}
            {order.shippingMethodName ? ` · ${order.shippingMethodName}` : ""}
          </p>
          <ol className="mt-6 space-y-3 border-l border-line pl-5">
            {order.history.map((h, i) => (
              <li key={i} className="relative font-ui text-[14px]">
                <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-charcoal" />
                <span className="font-medium">{statusLabel(h.status)}</span> <span className="text-ink-3">· {formatDate(h.createdAt, true)}</span>
                {h.note && <span className="block text-ink-2">{h.note}</span>}
              </li>
            ))}
          </ol>
          <ul className="mt-6 space-y-1 text-[14px] text-ink-2">
            {order.items.map((i) => (
              <li key={i.id}>
                {i.quantity} × {i.productName} {i.size ? `(${i.size})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
