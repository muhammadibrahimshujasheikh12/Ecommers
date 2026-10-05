import { z } from "zod";
import {
  canMoveOrder,
  canMovePayment,
  NOTE_MAX,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  REFERENCE_MAX,
  STATUS_NOTE_MAX,
} from "./status";

/*
 * Inputs of the admin order actions. Used by the forms (instant feedback) and
 * re-checked by every Server Action — the client is never trusted.
 */

// Control characters other than tab/newline have no place in notes or references.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const CONTROL_OR_NEWLINE = /[\u0000-\u001F\u007F]/;

const orderId = z.guid("This order could not be found.");

export const orderStatusSchema = z
  .object({
    orderId,
    /** The status the admin saw; the change is refused if it has moved on since. */
    expected: z.enum(ORDER_STATUSES),
    status: z.enum(ORDER_STATUSES, { error: "Choose the new status." }),
    note: z
      .string()
      .trim()
      .max(STATUS_NOTE_MAX, `Keep the note to ${STATUS_NOTE_MAX} characters or fewer.`)
      .refine((v) => !CONTROL.test(v), "Remove unsupported characters from the note."),
  })
  .refine((v) => v.status !== v.expected, { path: ["status"], message: "The order already has this status." })
  .refine((v) => v.status === v.expected || canMoveOrder(v.expected, v.status), {
    path: ["status"],
    message: "This change isn’t allowed from the current status.",
  });

export const orderPaymentSchema = z
  .object({
    orderId,
    expected: z.enum(PAYMENT_STATUSES),
    paymentStatus: z.enum(PAYMENT_STATUSES, { error: "Choose a payment status." }),
    reference: z
      .string()
      .trim()
      .max(REFERENCE_MAX, `Keep the reference to ${REFERENCE_MAX} characters or fewer.`)
      .refine((v) => !CONTROL_OR_NEWLINE.test(v), "Remove unsupported characters from the reference."),
  })
  .refine((v) => v.paymentStatus === v.expected || canMovePayment(v.expected, v.paymentStatus), {
    path: ["paymentStatus"],
    message: "This change isn’t allowed from the current payment status.",
  });

export const orderNoteSchema = z.object({
  orderId,
  body: z
    .string()
    .trim()
    .min(1, "Write a note first.")
    .max(NOTE_MAX, `Keep the note to ${NOTE_MAX.toLocaleString("en-US")} characters or fewer.`)
    .refine((v) => !CONTROL.test(v), "Remove unsupported characters from the note."),
});

export type OrderStatusInput = z.input<typeof orderStatusSchema>;
export type OrderPaymentInput = z.input<typeof orderPaymentSchema>;
export type OrderNoteInput = z.input<typeof orderNoteSchema>;
