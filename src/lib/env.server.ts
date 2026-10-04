import "server-only";
import { z } from "zod";

const boolean = (fallback: boolean) =>
  z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === "true"));

const serverSchema = z.object({
  /** Required with a Supabase project; unused in demo mode. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  /** Comma separated payment method codes to offer at checkout. */
  PAYMENT_METHODS: z.string().default("cod"),
  /** Sales tax applied on top of prices (0 when prices are tax-inclusive). */
  TAX_RATE: z.coerce.number().min(0).max(1).default(0),
  GUEST_CHECKOUT_ENABLED: boolean(true),
  BANK_TRANSFER_ACCOUNT_TITLE: z.string().optional(),
  BANK_TRANSFER_BANK_NAME: z.string().optional(),
  BANK_TRANSFER_IBAN: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/** Server-only secrets & settings. Parsed lazily so a misconfiguration fails loudly at first use. */
export function serverEnv(): ServerEnv {
  if (!cached) {
    cached = serverSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
      PAYMENT_METHODS: process.env.PAYMENT_METHODS || undefined,
      TAX_RATE: process.env.TAX_RATE || undefined,
      GUEST_CHECKOUT_ENABLED: process.env.GUEST_CHECKOUT_ENABLED || undefined,
      BANK_TRANSFER_ACCOUNT_TITLE: process.env.BANK_TRANSFER_ACCOUNT_TITLE || undefined,
      BANK_TRANSFER_BANK_NAME: process.env.BANK_TRANSFER_BANK_NAME || undefined,
      BANK_TRANSFER_IBAN: process.env.BANK_TRANSFER_IBAN || undefined,
    });
  }
  return cached;
}
