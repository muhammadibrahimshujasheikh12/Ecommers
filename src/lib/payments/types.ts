/**
 * Payment provider contract. Add Stripe, PayFast, JazzCash, Easypaisa, etc.
 * by implementing this interface and registering it in ./registry.ts.
 * Providers are only offered at checkout when isConfigured() is true, so no
 * method appears without real credentials behind it.
 */
export type PaymentOrder = {
  id: string;
  orderNumber: string;
  accessToken: string;
  total: number;
  currency: string;
  email: string;
};

export type PaymentInitiation =
  /** Nothing to collect online (COD, bank transfer) — go to confirmation. */
  | { type: "none" }
  /** Hosted payment page (card / wallet gateways). */
  | { type: "redirect"; url: string };

export interface PaymentProvider {
  /** Stored on orders.payment_method, e.g. "cod". */
  code: string;
  label: string;
  description: string;
  /** Order status right after placement. Online gateways stay "pending" until their webhook confirms. */
  initialOrderStatus: "pending" | "confirmed";
  isConfigured(): boolean;
  /** Customer-facing instructions shown after placing the order. */
  instructions?(order: PaymentOrder): string[];
  initiate(order: PaymentOrder): Promise<PaymentInitiation>;
  /**
   * Verify and apply a gateway webhook (signature check is the provider's job).
   * Should update orders.payment_status via the service role and return 200.
   */
  handleWebhook?(request: Request): Promise<Response>;
}
