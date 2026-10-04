import "server-only";
import { serverEnv } from "@/lib/env.server";
import { formatPrice } from "@/utils/format";
import type { PaymentProvider } from "./types";

const cashOnDelivery: PaymentProvider = {
  code: "cod",
  label: "Cash on Delivery",
  description: "Pay in cash when your order arrives. Available nationwide.",
  initialOrderStatus: "confirmed",
  isConfigured: () => true,
  instructions: (order) => [`Please keep ${formatPrice(order.total)} ready for the courier.`],
  initiate: async () => ({ type: "none" }),
};

const bankTransfer: PaymentProvider = {
  code: "bank_transfer",
  label: "Bank Transfer",
  description: "Transfer the order total to our bank account. Your order ships once payment is confirmed.",
  initialOrderStatus: "pending",
  isConfigured: () => Boolean(serverEnv().BANK_TRANSFER_IBAN),
  instructions: (order) => {
    const env = serverEnv();
    return [
      `Transfer ${formatPrice(order.total)} to ${env.BANK_TRANSFER_ACCOUNT_TITLE ?? "our account"}${env.BANK_TRANSFER_BANK_NAME ? ` at ${env.BANK_TRANSFER_BANK_NAME}` : ""}.`,
      `IBAN: ${env.BANK_TRANSFER_IBAN}`,
      `Use ${order.orderNumber} as the payment reference and email the receipt to our customer care team.`,
    ];
  },
  initiate: async () => ({ type: "none" }),
};

/**
 * All providers the codebase knows about. Online gateways (Stripe, PayFast,
 * JazzCash, Easypaisa…) are added here once their credentials exist; see
 * README → Payments for the integration checklist.
 */
const PROVIDERS: PaymentProvider[] = [cashOnDelivery, bankTransfer];

/** Providers enabled via PAYMENT_METHODS and fully configured. */
export function getPaymentProviders(): PaymentProvider[] {
  const enabled = serverEnv()
    .PAYMENT_METHODS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return enabled
    .map((code) => PROVIDERS.find((p) => p.code === code))
    .filter((p): p is PaymentProvider => Boolean(p && p.isConfigured()));
}

export function getPaymentProvider(code: string): PaymentProvider | null {
  return getPaymentProviders().find((p) => p.code === code) ?? null;
}

/** Public, serialisable view for the checkout UI. */
export function getPaymentOptions() {
  return getPaymentProviders().map((p) => ({ code: p.code, label: p.label, description: p.description }));
}
