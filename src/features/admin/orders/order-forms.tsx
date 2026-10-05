"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/providers/toast-provider";
import type { ActionResult, OrderStatus, PaymentStatus } from "@/types/domain";
import { statusLabel } from "@/utils/format";
import { addOrderNoteAction, updateOrderPaymentAction, updateOrderStatusAction } from "./actions";
import { ConfirmDialog } from "./confirm-dialog";
import {
  orderNoteSchema,
  orderPaymentSchema,
  orderStatusSchema,
  type OrderNoteInput,
  type OrderPaymentInput,
  type OrderStatusInput,
} from "./schemas";
import {
  DESTRUCTIVE_ORDER_STATUSES,
  DESTRUCTIVE_PAYMENT_STATUSES,
  NOTE_MAX,
  ORDER_STATUS_HINTS,
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  REFERENCE_MAX,
  STATUS_NOTE_MAX,
} from "./status";

/** Puts server-side field errors back on the form. */
function applyFieldErrors<T extends Record<string, unknown>>(result: ActionResult<unknown>, fields: (keyof T & string)[], setError: UseFormSetError<T>) {
  if (result.ok || !result.fieldErrors) return;
  for (const field of fields) {
    const message = result.fieldErrors[field]?.[0];
    if (message) setError(field as Parameters<UseFormSetError<T>>[0], { message });
  }
}

// ---------------------------------------------------------------------------
// Order status
// ---------------------------------------------------------------------------

export function OrderStatusForm({
  orderId,
  orderNumber,
  current,
  restocksOnCancel,
}: {
  orderId: string;
  orderNumber: string;
  current: OrderStatus;
  /** Supabase puts cancelled stock back on sale; the demo store never reserves it. */
  restocksOnCancel: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<OrderStatusInput | null>(null);
  const options = ORDER_TRANSITIONS[current];

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<OrderStatusInput>({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: { orderId, expected: current, status: "" as OrderStatus, note: "" },
  });
  const chosen = useWatch({ control, name: "status" });

  const save = (values: OrderStatusInput) =>
    startTransition(async () => {
      const result = await updateOrderStatusAction(values);
      setConfirming(null);
      if (result.ok) {
        toast({ message: result.message ?? "Status updated." });
      } else {
        applyFieldErrors(result, ["status", "note"], setError);
        toast({ tone: "error", message: result.error });
      }
      router.refresh();
    });

  const onSubmit = handleSubmit((values) => {
    if (DESTRUCTIVE_ORDER_STATUSES.has(values.status)) setConfirming(values);
    else save(values);
  });

  if (!options.length) {
    return (
      <p className="text-[14px] leading-relaxed text-ink-2">
        This order is {statusLabel(current).toLowerCase()}. {statusLabel(current)} orders are final, so the status can’t be
        changed.
      </p>
    );
  }

  const confirmCopy: Partial<Record<OrderStatus, { title: string; body: string; action: string }>> = {
    cancelled: {
      title: `Cancel order ${orderNumber}?`,
      body: restocksOnCancel
        ? "The order stops here and its items go back on sale. Cancelled orders can’t be reopened."
        : "The order stops here. Cancelled orders can’t be reopened.",
      action: "Cancel order",
    },
    returned: {
      title: `Mark ${orderNumber} as returned?`,
      body: "Use this once the customer has sent the items back. Returned orders no longer count towards revenue.",
      action: "Mark as returned",
    },
    refunded: {
      title: `Mark ${orderNumber} as refunded?`,
      body: "Refunded orders are final and no longer count towards revenue. Record the refund itself under Payment.",
      action: "Mark as refunded",
    },
  };
  const copy = confirming ? confirmCopy[confirming.status] : undefined;

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <input type="hidden" {...register("orderId")} />
        <input type="hidden" {...register("expected")} />
        <div>
          <Select label="Move to" required error={errors.status?.message} {...register("status")}>
            <option value="" disabled>
              Choose the next status…
            </option>
            {options.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
          <p aria-live="polite" className="mt-2 min-h-5 text-[13px] leading-snug text-ink-3">
            {chosen ? ORDER_STATUS_HINTS[chosen] : ""}
          </p>
        </div>
        <Textarea
          label="Note for the customer"
          rows={3}
          maxLength={STATUS_NOTE_MAX}
          className="min-h-24"
          hint="Optional. Shown on their order timeline — e.g. the courier and tracking number."
          error={errors.note?.message}
          {...register("note")}
        />
        <Button type="submit" size="sm" block loading={pending && !confirming}>
          Update status
        </Button>
      </form>
      <ConfirmDialog
        open={Boolean(confirming)}
        title={copy?.title ?? "Are you sure?"}
        confirmLabel={copy?.action ?? "Confirm"}
        pending={pending}
        onConfirm={() => confirming && save(confirming)}
        onCancel={() => setConfirming(null)}
      >
        {copy?.body}
      </ConfirmDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export function OrderPaymentForm({
  orderId,
  orderNumber,
  current,
  reference,
}: {
  orderId: string;
  orderNumber: string;
  current: PaymentStatus;
  reference: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<OrderPaymentInput | null>(null);
  const options: PaymentStatus[] = [current, ...PAYMENT_TRANSITIONS[current]];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<OrderPaymentInput>({
    resolver: zodResolver(orderPaymentSchema),
    defaultValues: { orderId, expected: current, paymentStatus: current, reference: reference ?? "" },
  });

  const save = (values: OrderPaymentInput) =>
    startTransition(async () => {
      const result = await updateOrderPaymentAction(values);
      setConfirming(null);
      if (result.ok) {
        toast({ message: result.message ?? "Payment saved." });
      } else {
        applyFieldErrors(result, ["paymentStatus", "reference"], setError);
        toast({ tone: "error", message: result.error });
      }
      router.refresh();
    });

  const onSubmit = handleSubmit((values) => {
    if (values.paymentStatus !== current && DESTRUCTIVE_PAYMENT_STATUSES.has(values.paymentStatus)) setConfirming(values);
    else save(values);
  });

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <input type="hidden" {...register("orderId")} />
        <input type="hidden" {...register("expected")} />
        <Select label="Payment status" error={errors.paymentStatus?.message} {...register("paymentStatus")}>
          {options.map((s) => (
            <option key={s} value={s}>
              {s === current ? `${statusLabel(s)} (current)` : statusLabel(s)}
            </option>
          ))}
        </Select>
        <Input
          label="Payment reference"
          autoComplete="off"
          maxLength={REFERENCE_MAX}
          placeholder="e.g. bank transfer ID or receipt no."
          hint="Optional. Removing it clears the saved reference."
          error={errors.reference?.message}
          {...register("reference")}
        />
        <Button type="submit" size="sm" variant="secondary" block loading={pending && !confirming} disabled={!isDirty}>
          Save payment
        </Button>
      </form>
      <ConfirmDialog
        open={Boolean(confirming)}
        title={`Mark payment for ${orderNumber} as refunded?`}
        confirmLabel="Mark as refunded"
        pending={pending}
        onConfirm={() => confirming && save(confirming)}
        onCancel={() => setConfirming(null)}
      >
        Record this once the money is back with the customer. A refunded payment can’t be changed again.
      </ConfirmDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal note
// ---------------------------------------------------------------------------

export function OrderNoteForm({ orderId, hint }: { orderId: string; hint: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<OrderNoteInput>({ resolver: zodResolver(orderNoteSchema), defaultValues: { orderId, body: "" } });
  const length = useWatch({ control, name: "body" })?.length ?? 0;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await addOrderNoteAction(values);
      if (result.ok) {
        reset({ orderId, body: "" });
        toast({ message: result.message ?? "Note added." });
      } else {
        applyFieldErrors(result, ["body"], setError);
        toast({ tone: "error", message: result.error });
      }
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <input type="hidden" {...register("orderId")} />
      <Textarea
        label="Add an internal note"
        rows={3}
        maxLength={NOTE_MAX}
        className="min-h-24"
        hint={`${hint} ${length.toLocaleString("en-US")}/${NOTE_MAX.toLocaleString("en-US")}`}
        error={errors.body?.message}
        {...register("body")}
      />
      <Button type="submit" size="sm" variant="secondary" loading={pending}>
        Add note
      </Button>
    </form>
  );
}
